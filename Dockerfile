FROM node:alpine AS build-env

WORKDIR /build

RUN apk add --no-cache make libtool autoconf automake g++ python3

COPY ./package*json ./
RUN npm install

FROM node:alpine
RUN addgroup -S orct2discord && adduser -S orct2discord -G orct2discord
WORKDIR /usr/src/openrct2-discord
COPY --from=build-env /build .
COPY . .
USER orct2discord

EXPOSE 35711
CMD [ "node", "index.js"]
