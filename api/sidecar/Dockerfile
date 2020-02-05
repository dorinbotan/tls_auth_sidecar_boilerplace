FROM node:12.13-alpine

WORKDIR /root/sidecar

COPY . /root/sidecar/

RUN (cd /root/sidecar; npm install)

CMD [ "/root/sidecar/index.js" ]
