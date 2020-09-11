FROM node:14-alpine as base
WORKDIR /app
COPY package.json package-lock.json /app
RUN npm install --production

FROM node:14-alpine as build
WORKDIR /app
COPY --from=base /app/ /app/
COPY src/ /app
RUN npm run build

FROM node:14-alpine as executor
WORKDIR /app
COPY --from=build /app/build /app
EXPOSE 32017
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem;\
chmod 400 rds-combined-ca-bundle.pem;
CMD ["npm", "run", "start"]