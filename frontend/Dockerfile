# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Fail fast if Next standalone output is missing/mis-shaped.
RUN test -f "/app/.next/standalone/server.js" \
  && test -d "/app/.next/static" \
  && echo "✅ Standalone server.js present" \
  && echo "✅ .next/static present"

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Fail fast at runtime layout too.
RUN test -f "/app/server.js" \
  && test -d "/app/.next/static" \
  && echo "✅ Runtime server.js present" \
  && echo "✅ Runtime .next/static present"

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]

