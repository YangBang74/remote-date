FROM node:22-alpine

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальной код
COPY . .

EXPOSE 5173

# Vite dev-сервер, доступный снаружи
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
