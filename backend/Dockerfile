# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files and prisma from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create sessions directory
RUN mkdir -p sessions && chmod 777 sessions

EXPOSE 3001

# Command to run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
