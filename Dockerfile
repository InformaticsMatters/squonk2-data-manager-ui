FROM node:16.13.1-alpine3.13

# Disable anonymous Next.js telemetry data...
ENV NEXT_TELEMETRY_DISABLED 1

# Add typical Node/NextJS groups and users
# Check https://bit.ly/3u8xXQR to understand why libc6-compat might be needed.
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    apk add --no-cache libc6-compat

WORKDIR /app
COPY . .

# Replace the application version (in package.json)
# with any defined 'tag', otherwise leave it at 0.0.0.
# Then just display the head of the file for clarification.
ARG tag=0.0.0
ENV TAG=$tag
RUN npm i -g pnpm@6.30.1 && \
    pnpm i \
    pnpm i -g json \
    cat package.json | json -e "this.version = '${TAG:-0.0.0}'" | tee package.json \
    head package.json

RUN chown --recursive nextjs:nodejs .

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

# We build, install and start the application at run-time.
# That's wehere the _real_ '.env' will be provided.
CMD ["./docker-entrypoint.sh"]
