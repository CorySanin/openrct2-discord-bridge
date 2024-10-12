FROM oven/bun:alpine AS base
FROM base AS build-env

WORKDIR /build

RUN apk add --no-cache make libtool autoconf automake g++ python3 py3-distutils-extra

COPY ./package*json ./
COPY ./bun.lockb ./
RUN bun install --production --no-progress

FROM base AS deploy
WORKDIR /usr/src/openrct2-discord
HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:3000 || exit 1
RUN apk add --no-cache curl
COPY --from=build-env /build .
COPY . .
USER bun

EXPOSE 35711
CMD [ "bun", "run", "index.ts"]
