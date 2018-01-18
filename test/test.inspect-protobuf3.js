'use strict';

var fs = require('fs')
  , path = require('path')

var test = require('tap').test;

var Long = require('long');

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
  },
  "long": Long.MAX_VALUE
};

var jsonInspect = '{"num":42,"payload":"money shot!","ip":"1.2.3.4","blob":"3q26yrrQ","one":{"list":[1,2],"values":{"foo":"x","bar":"y"}},"long":"9223372036854775807"}';

var binMessage = Test.encode(Test.create(jsonMessage)).finish();

test("inspect", function(t) {
  t.plan(2);

  testCommandOutput(t, ['-3', '-j', protoPath], binMessage, jsonInspect);
});

test("inspect env", function(t) {
  t.plan(2);

  var env = {INSPECT_PROTOBUF: path.join(protoPath, 'foosome.Test')};

  testCommandOutput(t, ['-3', '-j'], binMessage, jsonInspect, {env: env});
});

function testCommandOutput(t, args, payload, expected, options) {
  runCmd(command, args, options, payload, Buffer.byteLength(expected), function(code, out) {
    t.strictEquals(code, 0);
    t.strictEquals(out.toString(), expected);
  });  
}
