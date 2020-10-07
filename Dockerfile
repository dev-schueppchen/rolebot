FROM node:alpine

WORKDIR /app

COPY ./config ./config
COPY ./src ./src
COPY ./package.json .
COPY ./package-lock.json .
COPY ./tsconfig.json .

RUN npm ci \
    && npm run build

ENTRYPOINT ["npm", "start"]
