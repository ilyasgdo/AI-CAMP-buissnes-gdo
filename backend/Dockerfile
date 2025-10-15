FROM node:20-alpine

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copier le code
COPY . .

EXPOSE 3000

# Lancer en mode dev (watch) et appliquer les migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]