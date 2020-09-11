#### Create new queue
```
aws --endpoint-url http://localhost:9324 sqs create-queue --queue-name myqueue
```

#### Sending message
```
aws --endpoint-url http://localhost:9324 sqs send-message --queue-url http://localhost:9324/queue/default --message-body "Hello, queue!"

// json
aws --endpoint-url http://localhost:9324 sqs send-message --queue-url http://localhost:9324/queue/default --message-body '{"Records":[{"eventVersion":"2.1","eventSource":"aws:s3","awsRegion":"us-east-1","eventTime":"2020-09-11T09:18:49.961Z","eventName":"ObjectCreated:Put","userIdentity":{"principalId":"AWS:AIDAX32M4L4EWIW2JH2CQ"},"requestParameters":{"sourceIPAddress":"188.138.158.208"},"responseElements":{"x-amz-request-id":"0A9FA2059080152F","x-amz-id-2":"OT75YlRdBpht2Hi/hgAvqgLWoWtDNaN+Taugrn77KdqK5ivAGFU9D8IB854wQb0AYYheCJbZku4S4PsL1dB8tVtB+YMEE1Yx"},"s3":{"s3SchemaVersion":"1.0","configurationId":"new-article-upload","bucket":{"name":"hive-article-hosting-import--curie","ownerIdentity":{"principalId":"A3D7DRDN3I68RZ"},"arn":"arn:aws:s3:::hive-article-hosting-import--curie"},"object":{"key":"ijm-00214.zip","size":2091162,"eTag":"f83535e995b7f284dd5c7d570851811d","sequencer":"005F5B40FEDF378C0A"}}}]}'
```

#### View queue messages
```
aws --endpoint-url http://localhost:9324 sqs receive-message --queue-url http://localhost:9324/queue/default --wait-time-seconds 10
```


// double
{"Messages": [{"MessageId": "269da4c0-3a8b-4fda-b380-58c9bbfd6d5c", "ReceiptHandle": "AQEBPzrrXKsUfD3HJGidUy9FIbS7h96j8UKmd60q7St6q5fITkG1sG4KZ5JYWJAyaq3VFUXgZYQ3nVrDWjjpBNilcDSwe8fEgokYsXSmLXgl9YvEu1RvLHBR8H+qnklM0XREQGClhIqQ+RV/U9Cejg7edd9ORM3I3MzEHUt6HQmdwbkWCWHeR0cpLTLcqTnH+aE91IIdQfknEMQgS8DzCmmVYooiKSkMKRBJ39bsDQ/0j1IdTJkZE3dQUe0IeaWzbgm7QMnGCWKtEuKGbG4EN6XrZyDf+5XEh4wncgqUmRSbROJInvVPSAX+xlnUG2wZqrBU/nAkYtaleft7Yn6+x8kRNCaETu9bi+FzzEOz00RD5CMT5sr5bgxppsZJkyiDcDxSF2L4JfwWPpve7D8HeAWwEXS7BEEmdbjz0S5/vVlYLSc=", "MD5OfBody": "a9c810b9d290d27478d8a8f1a63c4de9", "Body": "{"Records":[{"eventVersion":"2.1","eventSource":"aws:s3","awsRegion":"us-east-1","eventTime":"2020-09-11T09:18:49.961Z","eventName":"ObjectCreated:Put","userIdentity":{"principalId":"AWS:AIDAX32M4L4EWIW2JH2CQ"},"requestParameters":{"sourceIPAddress":"188.138.158.208"},"responseElements":{"x-amz-request-id":"0A9FA2059080152F","x-amz-id-2":"OT75YlRdBpht2Hi/hgAvqgLWoWtDNaN+Taugrn77KdqK5ivAGFU9D8IB854wQb0AYYheCJbZku4S4PsL1dB8tVtB+YMEE1Yx"},"s3":{"s3SchemaVersion":"1.0","configurationId":"new-article-upload","bucket":{"name":"hive-article-hosting-import--curie","ownerIdentity":{"principalId":"A3D7DRDN3I68RZ"},"arn":"arn:aws:s3:::hive-article-hosting-import--curie"},"object":{"key":"ijm-00214.zip","size":2091162,"eTag":"f83535e995b7f284dd5c7d570851811d","sequencer":"005F5B40FEDF378C0A"}}}]}"}], "ResponseMetadata": {"RequestId": "b581d6fc-6317-5f4a-8a4d-812920a4b693", "HTTPStatusCode": 200, "HTTPHeaders": {"x-amzn-requestid": "b581d6fc-6317-5f4a-8a4d-812920a4b693", "date": "Fri, 11 Sep 2020 09:20:51 GMT", "content-type": "text/xml", "content-length": "2096"}, "RetryAttempts": 0}}

//single
{'Messages': [{'MessageId': '269da4c0-3a8b-4fda-b380-58c9bbfd6d5c', 'ReceiptHandle': 'AQEBPzrrXKsUfD3HJGidUy9FIbS7h96j8UKmd60q7St6q5fITkG1sG4KZ5JYWJAyaq3VFUXgZYQ3nVrDWjjpBNilcDSwe8fEgokYsXSmLXgl9YvEu1RvLHBR8H+qnklM0XREQGClhIqQ+RV/U9Cejg7edd9ORM3I3MzEHUt6HQmdwbkWCWHeR0cpLTLcqTnH+aE91IIdQfknEMQgS8DzCmmVYooiKSkMKRBJ39bsDQ/0j1IdTJkZE3dQUe0IeaWzbgm7QMnGCWKtEuKGbG4EN6XrZyDf+5XEh4wncgqUmRSbROJInvVPSAX+xlnUG2wZqrBU/nAkYtaleft7Yn6+x8kRNCaETu9bi+FzzEOz00RD5CMT5sr5bgxppsZJkyiDcDxSF2L4JfwWPpve7D8HeAWwEXS7BEEmdbjz0S5/vVlYLSc=', 'MD5OfBody': 'a9c810b9d290d27478d8a8f1a63c4de9', 'Body': '{"Records":[{"eventVersion":"2.1","eventSource":"aws:s3","awsRegion":"us-east-1","eventTime":"2020-09-11T09:18:49.961Z","eventName":"ObjectCreated:Put","userIdentity":{"principalId":"AWS:AIDAX32M4L4EWIW2JH2CQ"},"requestParameters":{"sourceIPAddress":"188.138.158.208"},"responseElements":{"x-amz-request-id":"0A9FA2059080152F","x-amz-id-2":"OT75YlRdBpht2Hi/hgAvqgLWoWtDNaN+Taugrn77KdqK5ivAGFU9D8IB854wQb0AYYheCJbZku4S4PsL1dB8tVtB+YMEE1Yx"},"s3":{"s3SchemaVersion":"1.0","configurationId":"new-article-upload","bucket":{"name":"hive-article-hosting-import--curie","ownerIdentity":{"principalId":"A3D7DRDN3I68RZ"},"arn":"arn:aws:s3:::hive-article-hosting-import--curie"},"object":{"key":"ijm-00214.zip","size":2091162,"eTag":"f83535e995b7f284dd5c7d570851811d","sequencer":"005F5B40FEDF378C0A"}}}]}'}], 'ResponseMetadata': {'RequestId': 'b581d6fc-6317-5f4a-8a4d-812920a4b693', 'HTTPStatusCode': 200, 'HTTPHeaders': {'x-amzn-requestid': 'b581d6fc-6317-5f4a-8a4d-812920a4b693', 'date': 'Fri, 11 Sep 2020 09:20:51 GMT', 'content-type': 'text/xml', 'content-length': '2096'}, 'RetryAttempts': 0}}

