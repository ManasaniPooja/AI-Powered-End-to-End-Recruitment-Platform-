FROM node:20-alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]