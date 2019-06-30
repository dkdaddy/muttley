# see https://nodejs.org/de/docs/guides/nodejs-docker-webapp/
# https://nrempel.com/how-to-create-a-docker-development-environment/
# https://github.com/nodejs/docker-node/blob/master/README.md
FROM node:alpine
WORKDIR /usr/src/app
# for the exexFile to work these need to be installed globally
RUN npm install -g mocha
RUN npm install -g source-map-support
# just copy package.json first so the npm install is cached before any source code changes
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
RUN npm run test
CMD ["node", "./src/mutt.js"]