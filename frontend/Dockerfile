FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 3001

# Lancer Next en dev sur le port 3001 (turbopack)
CMD ["sh", "-c", "npm run dev -- -p 3001"]