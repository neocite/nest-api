FROM node:lts-alpine3.13

RUN apk add --no-cache bash

USER node

WORKDIR /home/node/app