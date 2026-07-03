FROM node:20-slim AS builder

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/src ./src

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
