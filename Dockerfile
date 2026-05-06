FROM node:lts-alpine AS base
FROM base AS build-env

WORKDIR /build

RUN apk add --no-cache make libtool autoconf automake g++ python3 pnpm

RUN --mount=target=/build/package.json,source=package.json \
    --mount=target=/build/pnpm-lock.yaml,source=pnpm-lock.yaml \
    pnpm install
COPY --link . .
RUN pnpm run build && \
  pnpm install --prod

FROM base AS deploy
WORKDIR /usr/src/openrct2-discord
HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:3000/health || exit 1
RUN apk add --no-cache curl zlib
COPY --link --from=build-env /build .
USER node

EXPOSE 35711
CMD [ "node", "distribution/index.js"]
