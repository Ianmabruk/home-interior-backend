FROM node:20-slim AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/src ./src

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
