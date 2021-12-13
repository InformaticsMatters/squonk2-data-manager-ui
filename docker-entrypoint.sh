#!/bin/sh

# Build the image.
# We do this to handle URL and Paths set in the .env
# (which is 'injected' as a config map when run in Kubernetes).
# A 'default' is copied into the image using the build 'FLAVOUR'.
echo "+> Building"
pnpm build

echo "+> Running"
pnpm start
