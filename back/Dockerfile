FROM node:22-alpine

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальной код
COPY . .

EXPOSE 5000

# Dev-режим с ts-node-dev
CMD ["npm", "run", "dev"]
