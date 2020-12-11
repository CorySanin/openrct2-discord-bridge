FROM node:12-alpine

WORKDIR /usr/src/openrct2-discord

RUN apk add --no-cache git

COPY . .

EXPOSE 35711
CMD [ "node", "index.js"]
