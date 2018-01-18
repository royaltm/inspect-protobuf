'use strict';

var fs = require('fs')
  , path = require('path')

var test = require('tap').test;

var runCmd = require('./runner');

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
  t.plan(2);

  runCmd(command, ['-3', '-j', protoPath], null, binMessage, Buffer.byteLength(jsonInspect), function(code, out) {
    t.strictEquals(code, 0);
    t.strictEquals(out.toString(), jsonInspect);
  });  
});

test("inspect env", function(t) {
  t.plan(2);

  var env = {INSPECT_PROTOBUF: path.join(protoPath, 'foosome.Test')};

  runCmd(command, ['-3', '-j', protoPath], {env: env}, binMessage, Buffer.byteLength(jsonInspect), function(code, out) {
    t.strictEquals(code, 0);
    t.strictEquals(out.toString(), jsonInspect);
  });  
});
