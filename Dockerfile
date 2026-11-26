FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/www ./www
EXPOSE 8080
CMD ["sh", "-c", "serve -s www -l ${PORT:-8080}"]