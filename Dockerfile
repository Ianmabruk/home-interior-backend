FROM node:20-slim AS builder

ARG REBUILD=20260707

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/prisma ./prisma
COPY server/node_modules/.prisma ./node_modules/.prisma
COPY server/src ./src

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
