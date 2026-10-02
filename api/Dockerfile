FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/api

COPY api/package*.json ./
RUN npm install

COPY api/. .

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=../database/schema.prisma && npx prisma generate --schema=../database/schema.prisma && node ../database/seed.cjs && node src/index.js"]
