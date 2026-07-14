FROM node:20-slim AS builder

WORKDIR /app

COPY server/package*.json ./
RUN npm install

COPY server/prisma ./prisma
RUN ./node_modules/.bin/prisma generate --schema ./prisma/schema.prisma
RUN ./node_modules/.bin/prisma db push --schema ./prisma/schema.prisma

COPY server/src ./src

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
