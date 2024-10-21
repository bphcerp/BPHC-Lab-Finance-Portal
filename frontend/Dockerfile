FROM node:20.17.0

WORKDIR /app

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

COPY package.json /app

RUN npm install

COPY . /app