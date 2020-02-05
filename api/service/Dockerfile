FROM node:12.13-alpine

COPY . /root/service

RUN (cd /root/service; npm install)

CMD [ "/root/service/index.js" ]
