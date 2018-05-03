FROM node:latest
MAINTAINER pascal.luttgens@hotmail.fr

RUN mkdir -p /usr/src/ykn /var/log/yokinu /data

RUN echo 'deb http://ftp.debian.org/debian jessie-backports main' >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get -y --force-yes -t jessie-backports install ffmpeg

VOLUME ["/var/log/yokinu"]

WORKDIR /usr/src/ykn

COPY package.json .
RUN npm i --save-dev

COPY . .

EXPOSE 4100

ENTRYPOINT ["sh", "scripts/start.sh"]
