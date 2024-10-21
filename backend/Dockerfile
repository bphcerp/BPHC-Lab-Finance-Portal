FROM node:20.17.0

WORKDIR /app

EXPOSE 3000

CMD ["npm", "start"]

COPY package.json /app

RUN npm install

COPY . /app