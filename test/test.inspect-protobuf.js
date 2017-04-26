'use strict';

var fs = require('fs')
  , path = require('path')

var test = require('tap').test;

var fork = require('child_process').fork;

var command = path.join(__dirname, '..', 'bin', 'inspect-protobuf.js');

var protoPath = path.join(__dirname, 'test.proto');

var messages = require('protocol-buffers')(fs.readFileSync(protoPath));

var jsonMessage = {
  "num": 42,
  "payload": "money shot!",
  "ip": new Buffer([1,2,3,4]),
  "blob": new Buffer("DEADBACABAD0", "hex"),
  "one": {
    "list": [1, 2]
  }
};

var jsonInspect = '{"num":42,"payload":"money shot!","ip":"1.2.3.4","blob":"deadbacabad0","one":{"list":[1,2]}}';

var binMessage = messages.Test.encode(jsonMessage);

test("inspect", function(t) {
  t.plan(1);
  var child = fork(command, ['-j', protoPath], { stdio: ['pipe', 'pipe', process.stderr, 'ipc'] });

  child.stdout.once('readable', function() {
    t.strictEquals(child.stdout.read(jsonInspect.length).toString(), jsonInspect);
  });

  child.stdin.end(binMessage);
});

test("inspect env", function(t) {
  t.plan(1);
  var child = fork(command, ['-j'], {
    env: {INSPECT_PROTOBUF: path.join(protoPath, 'Test')},
    stdio: ['pipe', 'pipe', process.stderr, 'ipc'] });

  child.stdout.once('readable', function() {
    t.strictEquals(child.stdout.read(jsonInspect.length).toString(), jsonInspect);
  });

  child.stdin.end(binMessage);
});
