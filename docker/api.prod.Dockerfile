# API de production : dépendances installées et client Prisma généré à la
# construction ; au démarrage, migrations puis muscles de référence (le seed ne
# crée pas de comptes de test quand NODE_ENV=production).
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/api
COPY api/package*.json ./
RUN npm ci

COPY database /app/database
COPY api/. .
RUN npx prisma generate --schema=../database/schema.prisma

# Dossier de la base SQLite (volume), accessible à l'utilisateur non-root.
RUN mkdir -p /data && chown node:node /data

ENV NODE_ENV=production
EXPOSE 4000
USER node

CMD ["sh", "-c", "npx prisma migrate deploy --schema=../database/schema.prisma && node ../database/seed.cjs && node src/index.js"]
