import S3EventModel, { S3Event } from '../models/s3-event.model';
import SQSMessageModel from '../models/sqs-message.model';

export const renderEmailErrorTemplate = (message: SQSMessageModel<S3Event>, event: S3EventModel, err: Error): string =>
  `<html>
    <body>
        <h1>Import article from ${event.bucketName}/${event.objectKey} with SQS message ${message.messageId} failed!</h1>
        <p>
            <span style='color:red'>Reason: </span>
            <span>${err.message}</span>
        </p>
        <p>Watch AWS Cloudwatch logs for more details.</p>
    </body>
  </html>`;

export default renderEmailErrorTemplate;
