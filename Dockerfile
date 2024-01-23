FROM node:lts-alpine3.18 AS build-env

WORKDIR /build

RUN apk add --no-cache make libtool autoconf automake g++ python3

COPY ./package*json ./
RUN npm install

FROM node:lts-alpine3.18 as deploy
WORKDIR /usr/src/openrct2-discord
COPY --from=build-env /build .
COPY . .
USER node

EXPOSE 35711
CMD [ "node", "index.js"]
