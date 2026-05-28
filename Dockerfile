FROM node:22-alpine AS deps
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./apps/web/
WORKDIR /app/apps/web
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache sqlite
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/package-lock.json ./
COPY --from=builder /app/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/prisma ./prisma
COPY --from=builder /app/apps/web/next.config.ts ./next.config.ts
RUN mkdir -p /data && chown -R nextjs:nodejs /data /app
USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
