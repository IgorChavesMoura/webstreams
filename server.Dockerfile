FROM node:19-alpine

WORKDIR /

COPY ./server .

RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "start"]