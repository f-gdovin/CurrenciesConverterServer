FROM node:10.11.0-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000
#
#CMD ["node", "server.js"]