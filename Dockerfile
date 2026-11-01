FROM node:current-alpine AS base
FROM base AS build-env

WORKDIR /build

RUN apk add --no-cache make libtool autoconf automake g++ python3 pnpm

RUN --mount=target=/build/package.json,source=package.json \
    --mount=target=/build/pnpm-lock.yaml,source=pnpm-lock.yaml \
    --mount=target=/build/pnpm-workspace.yaml,source=pnpm-workspace.yaml \
    pnpm ci
COPY --link . .
RUN pnpm run build && \
  pnpm ci --prod

FROM base AS deploy
WORKDIR /usr/src/openrct2-discord
HEALTHCHECK  --timeout=3s \
  CMD wget -nv -t1 --spider http://localhost:8080/healthcheck || exit 1
RUN apk add --no-cache zlib
COPY --link --from=build-env /build .
USER node

EXPOSE 35711
CMD [ "node", "distribution/index.js"]
