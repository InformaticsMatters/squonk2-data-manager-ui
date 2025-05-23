# Install dependencies only when needed
FROM node:22.11.0-alpine3.19 AS base

FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches/

RUN npm i -g pnpm@10.9.0
RUN pnpm fetch --prod
RUN pnpm approve-builds
# RUN pnpm fetch
RUN pnpm i -P --ignore-scripts
# RUN pnpm i --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable anonymous Next.js telemetry data...
ENV NEXT_TELEMETRY_DISABLED=1

# Expose an optional GitHub SHA build argument.
# This is used to personalise the build.
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA:-""}

# The base path for the build
ARG BASE_PATH
ENV BASE_PATH=${BASE_PATH}

# RUN npm i -g pnpm@10.9.0
RUN echo "GIT_SHA=${GIT_SHA}" && npm run build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env ./.env

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
