#### Create new queue
```
aws --endpoint-url http://localhost:9324 sqs create-queue --queue-name myqueue
```

#### Sending message
```
aws --endpoint-url http://localhost:9324 sqs send-message --queue-url http://localhost:9324/queue/myqueue --message-body "Hello, queue!"
```

#### View queue messages
```
aws --endpoint-url http://localhost:9324 sqs receive-message --queue-url http://localhost:9324/queue/myqueue --wait-time-seconds 10
```
