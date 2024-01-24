FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV ELASTICSEARCH_HOST http://192.168.1.49:9200

EXPOSE 3000

CMD ["node","server.js"]





