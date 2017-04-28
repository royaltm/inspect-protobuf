inspect-protobuf
================

Inspect the content of messages encoded with google protobuf.


### Requirements

* nodejs ^4


### Installation


```
sudo npm install -g @royaltm/inspect-protobuf
```

### Usage

#### Display help

```
inspect-protobuf -h
```

```
Usage: inspect-protobuf [options] <proto-file> <ProtoMessageName>

  Options:

    -h, --help      output usage information
    -V, --version   output the version number
    -j, --json      json output
    -C, --no-color  monochrome inspect output
```


#### Arguments

Pass proto file and message name arguments.
If message name is not provided the first message found in proto file will be used.

```
cat message.bin | inspect-protobuf path/to/file.proto MyMessage
```

Alternatively set the environment variable `INSPECT_PROTOBUF="path/to/file.proto/MyMessage"`.
In this instance you *must* append the message name as the last path component.

##### Format options

```
# no colors
cat message.bin | inspect-protobuf -C

# use external json inspector
cat message.bin | inspect-protobuf -j | jq .
```

##### Kafkacat

This tool is best served with [kafkacat](https://github.com/edenhill/kafkacat).

```
export INSPECT_PROTOBUF="path/to/file.proto/MessageName"
kafkacat -C -b BROKER.BOOTSTRAP.NAME -c 20 -t SOME_TOPIC_NAME -o -1 -f '%S %s' | inspect-protobuf
```

The important part is `kafkacat ... -f '%S %s'`. It prepends each message with its byte length, so `inspect-protobuf` can distinguish each message in a message stream.
