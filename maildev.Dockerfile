FROM node:16.18.1

RUN npm i -g maildev@2.0.5


EXPOSE 1080
EXPOSE 1025
CMD maildev