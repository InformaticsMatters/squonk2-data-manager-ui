FROM node:16.13.1-alpine3.13

# Expose an optional GitHub SHA build argument.
# This is used to personalise the build.
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}

# Disable anonymous Next.js telemetry data...
ENV NEXT_TELEMETRY_DISABLED 1

# Whether to skip TSC and Eslint Checks
ARG SKIP_CHECKS
ENV SKIP_CHECKS=${SKIP_CHECKS:-0}
RUN echo "SKIP_CHECKS=${SKIP_CHECKS}"

# Add typical Node/NextJS groups and users
# Check https://bit.ly/3u8xXQR to understand why libc6-compat might be needed.
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    apk add --no-cache libc6-compat

WORKDIR /app
COPY . .

RUN npm i -g pnpm@6.30.1
RUN if $SKIP_CHECKS; then pnpm fetch --prod; else pnpm fetch; fi
RUN if $SKIP_CHECKS; \
    then pnpm i -P --frozen-lockfile --offline --ignore-scripts; \
    else pnpm i --frozen-lockfile --offline --ignore-scripts; fi && \
    chown --recursive nextjs:nodejs . && \
    echo "GIT_SHA=${GIT_SHA}"

# **DO NOT** set 'NODE_ENV any earlier than this in the Dockerfile.
# We must run 'pnpm install' (above) first, otherwise we'll get
# the folllowing error at run-time in the docker-entrypoint.sh...
#
#   "It looks like you're trying to use TypeScript
#   but do not have the required package(s) installed."
#
# Kubernetes can, of course, over-ride this if it wishes.
ENV NODE_ENV production

# Switch to the expected image user
# and indicate port 3000 should be open
USER nextjs
EXPOSE 3000

RUN pnpm build

# We build, install and start the application at run-time.
# That's wehere the _real_ '.env' will be provided.
CMD ["./docker-entrypoint.sh"]
