FROM node:lts-alpine AS base
FROM base AS build-env

WORKDIR /build

RUN apk add --no-cache make libtool autoconf automake g++ python3

RUN --mount=target=/build/package.json,source=package.json --mount=target=/build/package-lock.json,source=package-lock.json \
    npm ci
COPY --link . .
RUN npm run build && \
  npm ci --omit=dev

FROM base AS deploy
WORKDIR /usr/src/openrct2-discord
HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:3000/health || exit 1
RUN apk add --no-cache curl zlib 
COPY --link --from=build-env /build .
COPY . .
USER node

EXPOSE 35711
CMD [ "node", "distribution/index.js"]
