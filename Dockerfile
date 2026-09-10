# Image: node:20-alpine
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server.js community.js ./
COPY public ./public

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.js"]