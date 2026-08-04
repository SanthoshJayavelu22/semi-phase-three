FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Only copy the built dist
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 5003
CMD ["npm", "start"]

