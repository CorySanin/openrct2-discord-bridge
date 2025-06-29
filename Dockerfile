FROM node:lts-alpine AS base
FROM base AS build-env

WORKDIR /build

RUN apk add --no-cache make libtool autoconf automake g++ python3

COPY ./package*json ./
RUN npm ci --omit=dev

FROM base AS deploy
WORKDIR /usr/src/openrct2-discord
HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:3000/health || exit 1
RUN apk add --no-cache curl zlib 
COPY --from=build-env /build .
COPY . .
USER node

EXPOSE 35711
CMD [ "node", "--experimental-strip-types", "index.ts"]
