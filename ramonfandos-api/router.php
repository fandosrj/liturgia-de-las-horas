<?php
/* ============================================================
   Mi comunidad · Oficios compartidos — versión PHP + SQLite
   -------------------------------------------------------------
   Puerto directo de la misma lógica que ya corre en Node
   (community.js, tabla "spaces"), para hosting compartido normal
   (PHP + SQLite, sin Node ni WebSocket). Mismas rutas, mismo
   formato de respuesta: el cliente (public/lib/community.js) no
   necesita cambiar nada.

   Identidad por código de acceso, como ya hacían los "coros":
   sin correo ni contraseña por persona. Tres códigos por espacio
   -administrador, miembro, invitado (solo lectura)- y el
   administrador puede ascender a alguien a "editor" a mano.

   Diferencia real frente a la versión Node: no hay WebSocket, así
   que el aviso de "se ha actualizado un oficio" no llega al
   instante; el cliente ve lo último cada vez que abre la pantalla
   (recarga los datos en cada visita, no hace falta nada más).
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

/* ------------------------------ Base de datos ------------------------------ */
// Fuera de la carpeta pública (public/liturgiadelashoras/api/router.php ->
// sube tres niveles hasta la raíz de la cuenta, y de ahí a _data/).
$dbDir = __DIR__ . '/../../../_data';
if (!is_dir($dbDir)) mkdir($dbDir, 0775, true);
$dbFile = $dbDir . '/comunidad.sqlite';

$pdo = new PDO('sqlite:' . $dbFile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA journal_mode = WAL');
$pdo->exec('CREATE TABLE IF NOT EXISTS spaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code_admin TEXT NOT NULL UNIQUE,
  code_member TEXT NOT NULL UNIQUE,
  code_guest TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
)');
$pdo->exec('CREATE TABLE IF NOT EXISTS space_members (
  space_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  nick TEXT NOT NULL,
  role TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (space_id, device_id)
)');
$pdo->exec('CREATE TABLE IF NOT EXISTS space_offices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  piezas TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT "borrador",
  version INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT,
  updated_at INTEGER NOT NULL
)');
$pdo->exec('CREATE TABLE IF NOT EXISTS space_office_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  office_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  piezas TEXT NOT NULL,
  version INTEGER NOT NULL,
  updated_by TEXT,
  note TEXT,
  created_at INTEGER NOT NULL
)');

/* ------------------------------- Utilidades ------------------------------- */
function send($code, $obj) { http_response_code($code); echo json_encode($obj); exit; }

function bodyJson() {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function cleanStr($s, $max) {
  $s = is_string($s) ? $s : '';
  $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $s);
  $s = trim($s);
  return mb_substr($s, 0, $max);
}

function genCode($len = 8) {
  $chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  $out = '';
  for ($i = 0; $i < $len; $i++) $out .= $chars[random_int(0, strlen($chars) - 1)];
  return $out;
}

function uniqueCode($pdo, $len = 8) {
  do {
    $code = genCode($len);
    $stmt = $pdo->prepare('SELECT id FROM spaces WHERE code_admin = ? OR code_member = ? OR code_guest = ?');
    $stmt->execute([$code, $code, $code]);
  } while ($stmt->fetch());
  return $code;
}

function memberRole($pdo, $spaceId, $deviceId) {
  $stmt = $pdo->prepare('SELECT role FROM space_members WHERE space_id = ? AND device_id = ?');
  $stmt->execute([$spaceId, $deviceId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  return $row ? $row['role'] : null;
}

function canEdit($role) { return $role === 'admin' || $role === 'editor'; }

function snapshotVersion($pdo, $officeId, $nombre, $piezas, $version, $updatedBy, $note) {
  $stmt = $pdo->prepare('INSERT INTO space_office_versions (office_id, nombre, piezas, version, updated_by, note, created_at) VALUES (?,?,?,?,?,?,?)');
  $stmt->execute([$officeId, $nombre, $piezas, $version, $updatedBy, $note, (int) (microtime(true) * 1000)]);
}

/* --------------------------------- Rutas ---------------------------------- */
// Quita "/liturgiadelashoras/api" (o la ruta que sea hasta llegar a "/spaces...").
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pos = strpos($uri, '/api/spaces');
$path = $pos !== false ? substr($uri, $pos + strlen('/api')) : $uri; // deja "/spaces..."
$path = rtrim($path, '/');
if ($path === '') $path = '/spaces';
$method = $_SERVER['REQUEST_METHOD'];
$qs = $_GET;

$body = ($method === 'POST') ? bodyJson() : [];

/* POST /spaces -> crear */
if ($path === '/spaces' && $method === 'POST') {
  $deviceId = cleanStr($body['deviceId'] ?? '', 64);
  $nick = cleanStr($body['nick'] ?? '', 20);
  $name = cleanStr($body['name'] ?? '', 60);
  if (!$deviceId || mb_strlen($nick) < 2 || !$name) send(400, ['error' => 'Faltan datos (nombre del espacio y tu apodo).']);
  $codeAdmin = uniqueCode($pdo); $codeMember = uniqueCode($pdo); $codeGuest = uniqueCode($pdo);
  $now = (int) (microtime(true) * 1000);
  $stmt = $pdo->prepare('INSERT INTO spaces (name, code_admin, code_member, code_guest, created_at) VALUES (?,?,?,?,?)');
  $stmt->execute([$name, $codeAdmin, $codeMember, $codeGuest, $now]);
  $spaceId = (int) $pdo->lastInsertId();
  $stmt = $pdo->prepare('INSERT INTO space_members (space_id, device_id, nick, role, joined_at) VALUES (?,?,?,?,?)');
  $stmt->execute([$spaceId, $deviceId, $nick, 'admin', $now]);
  send(200, ['id' => $spaceId, 'name' => $name, 'role' => 'admin', 'codeAdmin' => $codeAdmin, 'codeMember' => $codeMember, 'codeGuest' => $codeGuest]);
}

/* POST /spaces/join */
if ($path === '/spaces/join' && $method === 'POST') {
  $deviceId = cleanStr($body['deviceId'] ?? '', 64);
  $nick = cleanStr($body['nick'] ?? '', 20);
  $code = strtoupper(cleanStr($body['code'] ?? '', 12));
  if (!$deviceId || mb_strlen($nick) < 2 || !$code) send(400, ['error' => 'Faltan datos (código y tu apodo).']);
  $stmt = $pdo->prepare('SELECT * FROM spaces WHERE code_admin = ? OR code_member = ? OR code_guest = ?');
  $stmt->execute([$code, $code, $code]);
  $space = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$space) send(404, ['error' => 'No existe ningún espacio con ese código.']);
  $codeRole = $code === $space['code_admin'] ? 'admin' : ($code === $space['code_member'] ? 'member' : 'invitado');
  $rank = ['invitado' => 0, 'member' => 1, 'editor' => 2, 'admin' => 3];
  $existingRole = memberRole($pdo, $space['id'], $deviceId);
  $finalRole = ($existingRole && $rank[$existingRole] >= $rank[$codeRole]) ? $existingRole : $codeRole;
  if ($existingRole) {
    $stmt = $pdo->prepare('UPDATE space_members SET role = ?, nick = ? WHERE space_id = ? AND device_id = ?');
    $stmt->execute([$finalRole, $nick, $space['id'], $deviceId]);
  } else {
    $stmt = $pdo->prepare('INSERT INTO space_members (space_id, device_id, nick, role, joined_at) VALUES (?,?,?,?,?)');
    $stmt->execute([$space['id'], $deviceId, $nick, $finalRole, (int) (microtime(true) * 1000)]);
  }
  send(200, ['id' => (int) $space['id'], 'name' => $space['name'], 'role' => $finalRole]);
}

/* GET /spaces/mine */
if ($path === '/spaces/mine' && $method === 'GET') {
  $deviceId = cleanStr($qs['deviceId'] ?? '', 64);
  $stmt = $pdo->prepare('SELECT s.id, s.name, m.role FROM spaces s JOIN space_members m ON m.space_id = s.id WHERE m.device_id = ? ORDER BY s.created_at DESC');
  $stmt->execute([$deviceId]);
  send(200, ['spaces' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

/* GET /spaces/{id} */
if (preg_match('#^/spaces/(\d+)$#', $path, $m) && $method === 'GET') {
  $spaceId = (int) $m[1];
  $deviceId = cleanStr($qs['deviceId'] ?? '', 64);
  $role = memberRole($pdo, $spaceId, $deviceId);
  if (!$role) send(403, ['error' => 'No perteneces a este espacio.']);
  $stmt = $pdo->prepare('SELECT id, name FROM spaces WHERE id = ?');
  $stmt->execute([$spaceId]);
  $space = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$space) send(404, ['error' => 'No existe ese espacio.']);
  $out = ['id' => (int) $space['id'], 'name' => $space['name'], 'role' => $role];
  if ($role === 'admin') {
    $stmt = $pdo->prepare('SELECT code_admin, code_member, code_guest FROM spaces WHERE id = ?');
    $stmt->execute([$spaceId]);
    $full = $stmt->fetch(PDO::FETCH_ASSOC);
    $out['codeAdmin'] = $full['code_admin']; $out['codeMember'] = $full['code_member']; $out['codeGuest'] = $full['code_guest'];
  }
  send(200, $out);
}

/* GET/POST /spaces/{id}/offices */
if (preg_match('#^/spaces/(\d+)/offices$#', $path, $m)) {
  $spaceId = (int) $m[1];
  if ($method === 'GET') {
    $deviceId = cleanStr($qs['deviceId'] ?? '', 64);
    $role = memberRole($pdo, $spaceId, $deviceId);
    if (!$role) send(403, ['error' => 'No perteneces a este espacio.']);
    if (canEdit($role)) {
      $stmt = $pdo->prepare('SELECT id, nombre, estado, version, updated_at FROM space_offices WHERE space_id = ? ORDER BY updated_at DESC');
      $stmt->execute([$spaceId]);
    } else {
      $stmt = $pdo->prepare("SELECT id, nombre, estado, version, updated_at FROM space_offices WHERE space_id = ? AND estado = 'publicado' ORDER BY updated_at DESC");
      $stmt->execute([$spaceId]);
    }
    send(200, ['offices' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
  }
  if ($method === 'POST') {
    $deviceId = cleanStr($body['deviceId'] ?? '', 64);
    $role = memberRole($pdo, $spaceId, $deviceId);
    if (!canEdit($role)) send(403, ['error' => 'No tienes permiso para editar oficios en este espacio.']);
    $nombre = cleanStr($body['nombre'] ?? '', 80);
    if (!$nombre) send(400, ['error' => 'Ponle un nombre al oficio.']);
    $piezas = json_encode(is_array($body['piezas'] ?? null) ? $body['piezas'] : []);
    $now = (int) (microtime(true) * 1000);
    if (!empty($body['id'])) {
      $officeId = (int) $body['id'];
      $stmt = $pdo->prepare('SELECT * FROM space_offices WHERE id = ? AND space_id = ?');
      $stmt->execute([$officeId, $spaceId]);
      $existing = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$existing) send(404, ['error' => 'No existe ese oficio.']);
      $version = (int) $existing['version'] + 1;
      $stmt = $pdo->prepare('UPDATE space_offices SET nombre = ?, piezas = ?, version = ?, updated_by = ?, updated_at = ? WHERE id = ?');
      $stmt->execute([$nombre, $piezas, $version, $deviceId, $now, $officeId]);
      snapshotVersion($pdo, $officeId, $nombre, $piezas, $version, $deviceId, 'edición');
      send(200, ['id' => $officeId, 'version' => $version, 'estado' => $existing['estado']]);
    }
    $stmt = $pdo->prepare('INSERT INTO space_offices (space_id, nombre, piezas, estado, version, updated_by, updated_at) VALUES (?,?,?,\'borrador\',1,?,?)');
    $stmt->execute([$spaceId, $nombre, $piezas, $deviceId, $now]);
    $officeId = (int) $pdo->lastInsertId();
    snapshotVersion($pdo, $officeId, $nombre, $piezas, 1, $deviceId, 'creación');
    send(200, ['id' => $officeId, 'version' => 1, 'estado' => 'borrador']);
  }
}

/* GET /spaces/{id}/offices/{officeId} */
if (preg_match('#^/spaces/(\d+)/offices/(\d+)$#', $path, $m) && $method === 'GET') {
  $spaceId = (int) $m[1]; $officeId = (int) $m[2];
  $deviceId = cleanStr($qs['deviceId'] ?? '', 64);
  $role = memberRole($pdo, $spaceId, $deviceId);
  if (!$role) send(403, ['error' => 'No perteneces a este espacio.']);
  $stmt = $pdo->prepare('SELECT * FROM space_offices WHERE id = ? AND space_id = ?');
  $stmt->execute([$officeId, $spaceId]);
  $office = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$office) send(404, ['error' => 'No existe ese oficio.']);
  if ($office['estado'] !== 'publicado' && !canEdit($role)) send(403, ['error' => 'Este oficio todavía no está publicado.']);
  send(200, ['id' => (int) $office['id'], 'nombre' => $office['nombre'], 'piezas' => json_decode($office['piezas'], true), 'estado' => $office['estado'], 'version' => (int) $office['version'], 'updated_at' => (int) $office['updated_at']]);
}

/* POST /spaces/{id}/offices/{officeId}/estado */
if (preg_match('#^/spaces/(\d+)/offices/(\d+)/estado$#', $path, $m) && $method === 'POST') {
  $spaceId = (int) $m[1]; $officeId = (int) $m[2];
  $deviceId = cleanStr($body['deviceId'] ?? '', 64);
  $role = memberRole($pdo, $spaceId, $deviceId);
  if ($role !== 'admin') send(403, ['error' => 'Solo un administrador puede publicar o retirar un oficio.']);
  $stmt = $pdo->prepare('SELECT id FROM space_offices WHERE id = ? AND space_id = ?');
  $stmt->execute([$officeId, $spaceId]);
  if (!$stmt->fetch()) send(404, ['error' => 'No existe ese oficio.']);
  $estado = ($body['estado'] ?? '') === 'publicado' ? 'publicado' : 'borrador';
  $stmt = $pdo->prepare('UPDATE space_offices SET estado = ? WHERE id = ?');
  $stmt->execute([$estado, $officeId]);
  send(200, ['ok' => true, 'estado' => $estado]);
}

/* GET /spaces/{id}/offices/{officeId}/versiones */
if (preg_match('#^/spaces/(\d+)/offices/(\d+)/versiones$#', $path, $m) && $method === 'GET') {
  $spaceId = (int) $m[1]; $officeId = (int) $m[2];
  $deviceId = cleanStr($qs['deviceId'] ?? '', 64);
  $role = memberRole($pdo, $spaceId, $deviceId);
  if (!canEdit($role)) send(403, ['error' => 'No tienes permiso para ver el historial.']);
  $stmt = $pdo->prepare('SELECT id FROM space_offices WHERE id = ? AND space_id = ?');
  $stmt->execute([$officeId, $spaceId]);
  if (!$stmt->fetch()) send(404, ['error' => 'No existe ese oficio.']);
  $stmt = $pdo->prepare('SELECT version, updated_by, note, created_at FROM space_office_versions WHERE office_id = ? ORDER BY version DESC');
  $stmt->execute([$officeId]);
  send(200, ['versiones' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

/* POST /spaces/{id}/offices/{officeId}/restaurar */
if (preg_match('#^/spaces/(\d+)/offices/(\d+)/restaurar$#', $path, $m) && $method === 'POST') {
  $spaceId = (int) $m[1]; $officeId = (int) $m[2];
  $deviceId = cleanStr($body['deviceId'] ?? '', 64);
  $role = memberRole($pdo, $spaceId, $deviceId);
  if (!canEdit($role)) send(403, ['error' => 'No tienes permiso para restaurar versiones.']);
  $stmt = $pdo->prepare('SELECT * FROM space_offices WHERE id = ? AND space_id = ?');
  $stmt->execute([$officeId, $spaceId]);
  $office = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$office) send(404, ['error' => 'No existe ese oficio.']);
  $stmt = $pdo->prepare('SELECT * FROM space_office_versions WHERE office_id = ? AND version = ?');
  $stmt->execute([$officeId, (int) ($body['version'] ?? 0)]);
  $old = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$old) send(404, ['error' => 'No existe esa versión.']);
  $newVersion = (int) $office['version'] + 1;
  $stmt = $pdo->prepare('UPDATE space_offices SET nombre = ?, piezas = ?, version = ?, updated_by = ?, updated_at = ? WHERE id = ?');
  $stmt->execute([$old['nombre'], $old['piezas'], $newVersion, $deviceId, (int) (microtime(true) * 1000), $officeId]);
  snapshotVersion($pdo, $officeId, $old['nombre'], $old['piezas'], $newVersion, $deviceId, 'restaurada v' . $old['version']);
  send(200, ['ok' => true, 'version' => $newVersion]);
}

/* GET /spaces/{id}/members */
if (preg_match('#^/spaces/(\d+)/members$#', $path, $m) && $method === 'GET') {
  $spaceId = (int) $m[1];
  $deviceId = cleanStr($qs['deviceId'] ?? '', 64);
  $role = memberRole($pdo, $spaceId, $deviceId);
  if ($role !== 'admin') send(403, ['error' => 'Solo un administrador puede ver los miembros.']);
  $stmt = $pdo->prepare('SELECT device_id, nick, role, joined_at FROM space_members WHERE space_id = ? ORDER BY joined_at ASC');
  $stmt->execute([$spaceId]);
  send(200, ['members' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

/* POST /spaces/{id}/members/{deviceId}/rol */
if (preg_match('#^/spaces/(\d+)/members/([^/]+)/rol$#', $path, $m) && $method === 'POST') {
  $spaceId = (int) $m[1]; $targetDevice = urldecode($m[2]);
  $deviceId = cleanStr($body['deviceId'] ?? '', 64);
  $actorRole = memberRole($pdo, $spaceId, $deviceId);
  if ($actorRole !== 'admin') send(403, ['error' => 'Solo un administrador puede cambiar roles.']);
  $nuevoRol = in_array($body['rol'] ?? '', ['admin', 'editor', 'member', 'invitado'], true) ? $body['rol'] : null;
  if (!$nuevoRol) send(400, ['error' => 'Rol no válido.']);
  if ($targetDevice === $deviceId && $nuevoRol !== 'admin') {
    $stmt = $pdo->prepare("SELECT COUNT(*) c FROM space_members WHERE space_id = ? AND role = 'admin'");
    $stmt->execute([$spaceId]);
    if ((int) $stmt->fetch(PDO::FETCH_ASSOC)['c'] <= 1) {
      send(400, ['error' => 'Debe quedar siempre al menos un administrador: nombra a otro antes de dejar de serlo.']);
    }
  }
  $stmt = $pdo->prepare('UPDATE space_members SET role = ? WHERE space_id = ? AND device_id = ?');
  $stmt->execute([$nuevoRol, $spaceId, $targetDevice]);
  send(200, ['ok' => true]);
}

send(404, ['error' => 'No encontrado: ' . $path]);
