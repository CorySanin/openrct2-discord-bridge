FROM node:12-alpine AS build-env

WORKDIR /build

RUN apk add --no-cache git python make gcc g++

COPY . .

RUN npm install

FROM node:12-alpine
RUN addgroup -S orct2discord && adduser -S orct2discord -G orct2discord
WORKDIR /usr/src/openrct2-discord
COPY --from=build-env /build .
USER orct2discord

EXPOSE 35711
CMD [ "node", "index.js"]
