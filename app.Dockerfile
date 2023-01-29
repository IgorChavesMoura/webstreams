FROM nginx:1.23.3-alpine

WORKDIR /

COPY ./app ./app

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx" , "-g", "daemon off;"]