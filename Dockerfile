FROM oven/bun:debian AS base
FROM base AS build-env

WORKDIR /build

RUN apt-get update \
    && apt-get install -y --no-install-recommends make libtool autoconf automake g++ python3 python3-distutils-extra \
    && rm -rf /var/lib/apt/lists/*

COPY ./package*json ./
COPY ./bun.lockb ./
RUN bun install --production --no-progress

FROM base AS deploy
WORKDIR /usr/src/openrct2-discord
HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:3000 || exit 1
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build-env /build .
COPY . .
USER bun

EXPOSE 35711
CMD [ "bun", "run", "index.ts"]
