FROM node:20.17.0

RUN apt-get update && apt-get install -y wkhtmltopdf

WORKDIR /app

EXPOSE 3000

CMD ["npm", "start"]

COPY package.json /app

RUN npm install

COPY . /app