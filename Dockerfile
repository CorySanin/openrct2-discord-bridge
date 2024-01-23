FROM oven/bun:alpine AS build-env

WORKDIR /build

RUN apk add --no-cache make libtool autoconf automake g++ python3 || echo 'ignoring error'

COPY ./package*json ./
COPY ./bun.lockb ./
RUN bun install --production --no-progress

FROM oven/bun:alpine as deploy
WORKDIR /usr/src/openrct2-discord
HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:3000 || exit 1
RUN apk add --no-cache curl
COPY --from=build-env /build .
COPY . .
USER bun

EXPOSE 35711
CMD [ "bun", "run", "index.ts"]
