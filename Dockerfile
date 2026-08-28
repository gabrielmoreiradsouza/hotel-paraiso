FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app

# Install + Build in single stage (workspace packages need source during install)
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
# Build workspace packages first (artax-client, tracking need tsc)
RUN pnpm --filter @hotel-paraiso/artax-client build || true
RUN pnpm --filter @hotel-paraiso/tracking build || true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-VW178YY861
ENV NEXT_PUBLIC_GOOGLE_ADS_ID=AW-18401755556
ENV NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=fPOhytFTUvv38aiWOTU6Ppn1czmVuZ1McRCO42Xp-kE
ENV NEXT_PUBLIC_META_PIXEL_ID=4310343772554446
ARG CMS_URL=https://cms.hotelparaiso.moreirads.cloud
ENV CMS_URL=${CMS_URL}
RUN pnpm --filter @hotel-paraiso/web build

# Production
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy standalone server
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy public assets to the correct location for standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
