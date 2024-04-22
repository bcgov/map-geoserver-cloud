FROM node:latest

WORKDIR /app

COPY package*.json .

RUN npm i

COPY index.js .

ENTRYPOINT [ "node", "index" ]