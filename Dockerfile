FROM node:alpine
MAINTAINER pascal.luttgens@hotmail.fr

RUN apk update && apk upgrade && \
    apk add --no-cache bash git

RUN mkdir -p /usr/src/ykn /var/log/yokinu
VOLUME ["/var/log/yokinu"]

WORKDIR /usr/src/ykn

COPY package.json .
RUN npm i
COPY . .

EXPOSE 4100

CMD ["npm", "run", "dev"]
