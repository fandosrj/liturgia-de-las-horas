package es.ramonfandos.liturgiahoras;

import android.Manifest;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int RC_AUDIO = 1001;

    @Override
    public void onStart() {
        super.onStart();

        // Permiso de sistema para grabar (necesario ademas del permiso de la
        // pagina web, para "Grabar" en cada salmo con la propia voz).
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, RC_AUDIO);
        }

        // El WebView de Android deniega getUserMedia por defecto salvo que la
        // app lo conceda explicitamente aqui.
        final WebChromeClient previo = this.bridge.getWebView().getWebChromeClient();
        this.bridge.getWebView().setWebChromeClient(new MicPermissionWebChromeClient(previo));
    }

    private static class MicPermissionWebChromeClient extends WebChromeClient {
        private final WebChromeClient delegate;

        MicPermissionWebChromeClient(WebChromeClient delegate) {
            this.delegate = delegate;
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            request.grant(request.getResources());
        }

        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
            if (delegate != null) return delegate.onShowFileChooser(webView, filePathCallback, fileChooserParams);
            return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
        }

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (delegate != null) delegate.onProgressChanged(view, newProgress);
            else super.onProgressChanged(view, newProgress);
        }

        @Override
        public void onReceivedTitle(WebView view, String title) {
            if (delegate != null) delegate.onReceivedTitle(view, title);
            else super.onReceivedTitle(view, title);
        }

        @Override
        public boolean onConsoleMessage(ConsoleMessage cm) {
            if (delegate != null) return delegate.onConsoleMessage(cm);
            return super.onConsoleMessage(cm);
        }
    }
}
