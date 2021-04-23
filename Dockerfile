FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN rm -rf ./src

EXPOSE 3000

CMD ["npm", "run", "start:prod"]