'use strict';

var fs = require('fs')
  , path = require('path')

var test = require('tap').test;

var fork = require('child_process').fork;

var command = path.join(__dirname, '..', 'bin', 'inspect-protobuf.js');

var protoPath = path.join(__dirname, 'test3.proto');

var Test = require('protobufjs').parse(fs.readFileSync(protoPath)).root.lookupType('foosome.Test');

var jsonMessage = {
  "num": 42,
  "payload": "money shot!",
  "ip": new Buffer([1,2,3,4]),
  "blob": new Buffer("DEADBACABAD0", "hex"),
  "one": {
    "list": [1, 2],
    "values": {"foo": "x", "bar": "y"}
  }
};

var jsonInspect = '{"num":42,"payload":"money shot!","ip":"1.2.3.4","blob":"3q26yrrQ","one":{"list":[1,2],"values":{"foo":"x","bar":"y"}}}';

var binMessage = Test.encode(Test.create(jsonMessage)).finish();

test("inspect", function(t) {
  t.plan(1);
  var child = fork(command, ['-3', '-j', protoPath], { stdio: ['pipe', 'pipe', process.stderr, 'ipc'] });

  child.stdout.on('readable', function readable() {
    var out = child.stdout.read(jsonInspect.length);
    if (out) {
      child.stdout.removeListener('readable', readable);
      t.strictEquals(out.toString(), jsonInspect);
    }
  });

  child.stdin.end(binMessage);
});

test("inspect env", function(t) {
  t.plan(1);
  var child = fork(command, ['-3', '-j'], {
    env: {INSPECT_PROTOBUF: path.join(protoPath, 'foosome.Test')},
    stdio: ['pipe', 'pipe', process.stderr, 'ipc'] });

  child.stdout.once('readable', function readable() {
    var out = child.stdout.read(jsonInspect.length);
    if (out) {
      child.stdout.removeListener('readable', readable);
      t.strictEquals(out.toString(), jsonInspect);
    }
  });

  child.stdin.end(binMessage);
});
