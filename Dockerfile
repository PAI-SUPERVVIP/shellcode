FROM node:18-alpine

RUN apk add --no-cache bash python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
