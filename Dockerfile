FROM node:14.5.0-alpine3.12 AS node

WORKDIR /app

#
# Stage: Production NPM install
#
FROM node AS npm-prod

COPY package.json \
  package-lock.json \
  ./

RUN npm install --production

#
# Stage 1: Dev dependency NPM install
#
FROM npm-prod AS npm-dev

RUN npm install

#
# Stage: Development environment
#
FROM node AS dev
ENV NODE_ENV=development
ENV LOGGING_DEBUG=true

COPY .eslintignore \
  .eslintrc.js \
  jest.config.js \
  tsconfig.json \
  tsconfig.dev.json \
  ./
COPY --from=npm-dev /app/ .
COPY test/ test/
COPY src/ src/

CMD ["npm", "run", "start:dev"]

#
# Stage: Production build
#
FROM dev AS build-prod
ENV NODE_ENV=production

RUN npm run build

#
# Stage: Production environment
#
FROM node AS prod
ENV NODE_ENV=production

COPY --from=npm-prod /app/ .
COPY --from=build-prod /app/build/ build/

EXPOSE 32017

# Download AWS RDS Root CAs
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem;\
chmod 400 rds-combined-ca-bundle.pem;

CMD ["npm", "run", "start"]
