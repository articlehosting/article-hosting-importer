FROM node:14-alpine as base
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install --production;\
    npm install typescript --save-dev;
COPY src/ /app/src/
COPY test/ /app/test/
COPY .eslintignore \
  .eslintrc.js \
  jest.config.js \
  tsconfig.json \
  tsconfig.dev.json \
  /app/
RUN npm run build

FROM node:14-alpine as executor
WORKDIR /app
COPY --from=base /app/build /app/
COPY --from=base /app/package.json /app/package.json
EXPOSE 32017
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem;\
chmod 400 rds-combined-ca-bundle.pem;
CMD ["npm", "run", "start"]
