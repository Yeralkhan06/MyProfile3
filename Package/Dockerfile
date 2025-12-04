FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Инициализируем базу данных
RUN npm run init-db

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]