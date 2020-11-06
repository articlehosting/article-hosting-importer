Article Hosting Importer
========

[![Commit checks][Checks badge]][Checks]
[![Open issues][Open issues badge]][Open issues]
[![License][License badge]][License]

It's written in [TypeScript].

Table of contents
-----------------

- [Article Hosting Importer](#article-hosting-importer)
  - [Table of contents](#table-of-contents)
  - [Development](#development)
    - [Running the app](#running-the-app)
    - [Running the tests](#running-the-tests)
    - [Linting](#linting)
  - [Testing](#testing)
      - [Running the scenarios locally](#running-locally)
      - [Running the scenarios on production](#running-on-production)
  - [Operations](#operations)
    - [Configure images on local machine](#configure-images-on-local-machine)
  - [License](#license)

Development
-----------

<details>

<summary>Requirements</summary>

- [Docker]
- [Node.js v14.6.0]
- [NPM v6.14.6]
- [AWS CLI V2]

</details>

### Running the app
<details>

Create a local docker-compose.yaml file with contents:

```yaml
version: "3"

services:
  sqs:
    image: graze/sqs-local
    ports:
      - 9324:9324
    volumes:
      - ./article-hosting-importer/elasticmq.conf:/elasticmq.conf
  ses:
    image: "jdelibas/aws-ses-local"
    ports:
      - 9001:9001
  minio:
    image: minio/minio
    command: ["server", "/data"]
    volumes:
      - ./article-hosting-importer/data:/data
    ports:
      - 9000:9000
    environment:
      MINIO_ACCESS_KEY: test
      MINIO_SECRET_KEY: password
  mongo-alpine:
    image: mvertes/alpine-mongo:3.6.5-0
    restart: always
    ports:
      - 27017:27017
  cantaloupe:
    image: mitlibraries/cantaloupe
    ports:
      - 8182:8182
    environment:
      HTTP_HTTP2_ENABLED: "true"
      HTTPS_HTTP2_ENABLED: "true"
      ENDPOINT_IIIF_CONTENT_DISPOSITION: none
      SOURCE_STATIC: S3Source
      S3SOURCE_ENDPOINT: http://minio:9000
      S3SOURCE_ACCESS_KEY_ID: test
      S3SOURCE_SECRET_KEY: password
      S3SOURCE_BASICLOOKUPSTRATEGY_BUCKET_NAME: hive-article-hosting-storage--curie
      S3SOURCE_BASICLOOKUPSTRATEGY_PATH_PREFIX: 'articles/'
      S3SOURCE_BASICLOOKUPSTRATEGY_PATH_SUFFIX: ''
      CACHE_SERVER_DERIVATIVE_ENABLED: "true"
      CACHE_SERVER_DERIVATIVE: S3Cache
      CACHE_SERVIER_DERIVATIVE_TTL_SECONDS: 0
      CACHE_SERVER_PURGE_MISSING: "true"
      CACHE_SERVER_WORKER_ENABLED: "true"
      S3CACHE_ENDPOINT: http://minio:9000
      S3CACHE_ACCESS_KEY_ID: test
      S3CACHE_SECRET_KEY: password
      S3CACHE_BUCKET_NAME: hive-article-hosting-storage--curie
      S3CACHE_OBJECT_KEY_PREFIX: cache
      LOG_APPLICATION_LEVEL: warn
      LOG_ACCESS_CONSOLEAPPENDER_ENABLED: "true"
      PROCESSOR_FALLBACK: Java2dProcessor
      OVERLAYS_STRATEGY: BasicStrategy
```

*note:* if you have another structure of ./article-hosting-importer/elasticmq.conf, so create then near docker-compose.yaml *elasticmq.conf* file and put that contents:
```
queues {
    default {
        defaultVisibilityTimeout = 10 seconds
        delay = 5 seconds
        receiveMessageWait = 0 seconds
    }
}
```
Btw, you can pointing services directly to aws, in that case you don't need for the docker-compose, everything what you need its just to set correct env variables at .env file.

Run ```docker-compose up``` for that file, create S3 buckets for minio image (if not exists), upload zip files (ijm-202.zip file uploaded by default), push sqs events to handle zip files, go to article hosting to check the result!

1. Go to folder with ```docker-compose.yaml``` file which we created before, and run ```docker-compose up```
2. Open in browser http://localhost:9000, login (test, password) and check if buckets exists. By default should be created
* ```hive-article-hosting-storage--curie```, should have ```articles``` folder where stored article's files (images, pdfs etc.) under article's publisherId identifier. Example ```articles/00202/ijm-00202.pdf```
* ```hive-article-hosting-import--curie```, bucket with zip sources, there should be present ```ijm-202.zip``` under ```ijm/ijm-00202.zip``` path in the bucket
* ```hive-article-hosting-archive--curie```, to archive processed zip files
3. Push an sqs event to import ijm-202.zip article with the following cli command (require to install [AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html))
```
aws --endpoint-url http://localhost:9324 sqs send-message --queue-url http://localhost:9324/queue/default --message-body '{"Records":[{"eventVersion":"2.1","eventSource":"aws:s3","awsRegion":"us-east-1","eventTime":"2020-09-11T09:18:49.961Z","eventName":"ObjectCreated:Put","userIdentity":{"principalId":"AWS:AIDAX32M4L4EWIW2JH2CQ"},"requestParameters":{"sourceIPAddress":"188.138.158.208"},"responseElements":{"x-amz-request-id":"0A9FA2059080152F","x-amz-id-2":"OT75YlRdBpht2Hi/hgAvqgLWoWtDNaN+Taugrn77KdqK5ivAGFU9D8IB854wQb0AYYheCJbZku4S4PsL1dB8tVtB+YMEE1Yx"},"s3":{"s3SchemaVersion":"1.0","configurationId":"new-article-upload","bucket":{"name":"hive-article-hosting-import--curie","ownerIdentity":{"principalId":"A3D7DRDN3I68RZ"},"arn":"arn:aws:s3:::hive-article-hosting-import--curie"},"object":{"key":"ijm/ijm-00202.zip","size":2091162,"eTag":"f83535e995b7f284dd5c7d570851811d","sequencer":"005F5B40FEDF378C0A"}}}]}'
```
That command will push the event message to SQS docker image with following context which includes name of the source bucket (in our case is hive-article-hosting-import--curie) and ```ijm/ijm-00202.zip``` file. So if you want to import more articles, you need to place in the bucket corresponding zip files and push messages to SQS to handle that file (substitute value from command ```ijm/ijm-00202.zip``` to name with your file which you want to import)

4. Run ```npm run start:dev``` for article-hosting-importer (install dependencies first with ```npm install```)
5. Run ```npm run start:dev``` for article-hosting ui app (install dependencies first with ```npm install```)
6. Go to browser link http://localhost:8000 to see the result

To build and run the app for development, execute:

```shell
npm run start:dev
```

Service will connect to local SQS service docker image and fetch messages from the queue, download the file from bucket, extract that file and convert xml file with stencila, insert result to db and move files to specific bucket.
</details>

<details>

<summary>Configuring environment variables</summary>

Make a copy of existing `.env.example` file to `.env` to pass environment variables to the container:

```
DISQUS_API_KEY=...
```

Re-run `npm run start:dev` after modifying this file.

</details>

### Running the tests

We use [Jest] to test the app. You can run it by executing:

```shell
npm run test
```

### Linting

We lint the app with [ESLint]. You can run it by:

```shell
npm run lint
```

You can fix problems, where possible, by executing:

```shell
npm run lint:fix
```

### Looking at logs

Logs of all Pods are streamed to [AWS CloudWatch][AWS CloudWatch logs] for persistence and searchability.

A [CloudWatch dashboard] graphs log lines representing errors and shows the state of the alarm.

A [monitoring SNS topic] triggers a [lambda function that notifies the Slack #article-hosting-commits channel][monitoring lambda].

License
-------

We released this software under the [MIT license][license]. Copyright © 2020 [eLife Sciences Publications, Ltd][eLife].

[AWS CloudWatch logs]: https://aws.amazon.com/
[AWS CLI V2]: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html
[Build]: https://github.com/hivereview/article-hosting-importer/actions?query=workflow%3ACI
[Checks]: https://github.com/hivereview/article-hosting-importer/actions
[Checks badge]: https://flat.badgen.net/github/checks/hivereview/article-hosting-importer/master?icon=github
[CloudWatch dashboard]: https://aws.amazon.com/
[Docker]: https://www.docker.com/
[eLife]: https://elifesciences.org/
[ESLint]: https://eslint.org/
[Jest]: https://jestjs.io/
[License]: LICENSE.md
[License badge]: https://flat.badgen.net/badge/license/MIT/blue
[Makefile]: Makefile
[Monitoring SNS topic]: https://aws.amazon.com/
[Monitoring lambda]: https://aws.amazon.com/
[Node.js v14.6.0]: https://nodejs.org/en/download/
[NPM v6.14.6]: https://www.npmjs.com/
[Open issues]: https://github.com/hivereview/article-hosting-importer/issues?q=is%3Aissue+is%3Aopen
[Open issues badge]: https://flat.badgen.net/github/open-issues/hivereview/article-hosting-importer?icon=github&color=pink
[Production deployments]: https://github.com/hivereview/article-hosting-importer/actions?query=workflow%3AProduction
[TypeScript]: https://www.typescriptlang.org/
