FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app

# Install dependencies — copy ALL workspace package.jsons for correct resolution
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY apps/cms/package.json ./apps/cms/
COPY apps/admin/package.json ./apps/admin/
COPY apps/workers/package.json ./apps/workers/
COPY packages/ui/package.json ./packages/ui/
COPY packages/tracking/package.json ./packages/tracking/
COPY packages/artax-client/package.json ./packages/artax-client/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/learning/package.json ./packages/learning/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/ ./
COPY . .
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
