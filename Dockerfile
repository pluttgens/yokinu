FROM node:alpine
MAINTAINER pascal.luttgens@hotmail.fr

RUN apk update && apk upgrade && \
    apk add --no-cache bash git

RUN mkdir -p /usr/src/ykn
WORKDIR /usr/src/ykn

COPY package.json .
RUN npm i
COPY src .

EXPOSE 3000

CMD ["npm", "run", "dev"]
