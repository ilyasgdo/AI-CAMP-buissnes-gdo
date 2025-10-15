FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3001

# Lancer Next en dev sur le port 3001 (turbopack)
CMD ["sh", "-c", "npm run dev -- -p 3001"]