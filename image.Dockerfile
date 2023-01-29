FROM node:19-alpine

WORKDIR /

COPY ./server .

RUN npm ci

EXPOSE 3001

CMD ["npm", "run", "start:image"]