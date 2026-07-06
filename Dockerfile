FROM node:20-slim AS builder

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev && npm install prisma --no-save

COPY server/prisma ./prisma
RUN npx prisma generate --schema ./prisma/schema.prisma

COPY server/src ./src

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
