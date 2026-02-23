FROM node:18

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --unsafe-perm

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
