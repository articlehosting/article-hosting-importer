FROM node:14-alpine as base
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install
COPY src/ /app/src/
COPY test/ /app/test/
COPY .eslintignore \
  .eslintrc.js \
  jest.config.js \
  tsconfig.json \
  tsconfig.dev.json \
  /app/
RUN npm run build

FROM node:14-alpine as nodemods
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install --production

FROM node:14-alpine as executor
WORKDIR /app
COPY --from=base /app/package.json /app/package.json
COPY --from=base /app/build /app/build
COPY --from=nodemods /app/node_modules /app/node_modules
EXPOSE 32017
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem;\
chmod 400 rds-combined-ca-bundle.pem;
CMD ["npm", "run", "start"]
