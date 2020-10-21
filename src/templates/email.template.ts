import S3EventModel from '../models/s3-event.model';

export const renderEmailErrorTemplate = (event: S3EventModel, err: Error): string =>
  `<html>
    <body>
        <h3>Import article from ${event.bucketName}/${event.objectKey}</h3>
        <p>
            <span style='color:red'>Reason: </span>
            <span>${err.message}</span>
        </p>
        <p>Watch AWS Cloudwatch logs for more details.</p>
    </body>
  </html>`;

export default renderEmailErrorTemplate;
