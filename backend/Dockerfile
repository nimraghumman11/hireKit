FROM node:20-alpine AS builder
WORKDIR /app
# OpenSSL 3 libs so `prisma generate` detects the right engine for linux-musl
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Runtime libs for Prisma engine (OpenSSL 3 on Alpine)
RUN apk add --no-cache openssl libc6-compat
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
COPY docker-entrypoint.sh ./
# Normalize line endings when the repo is checked out on Windows
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
