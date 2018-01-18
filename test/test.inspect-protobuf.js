'use strict';

var fs = require('fs')
  , path = require('path')

var test = require('tap').test;

var encode = require('msgpack-lite').encode;

var runCmd = require('./runner');

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

var jsonMessageMp = {
  "num": -0.5,
  "payload": "",
  "ip": new Buffer([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
  "blob": encode({foo: "bar"}),
  "one": {
    "list": []
  }
};

var jsonMessageJSON = {
  "num": 0.5,
  "payload": "",
  "ip": new Buffer([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
  "blob": new Buffer(JSON.stringify({bar: "baz"}), 'utf8'),
  "one": {
    "list": []
  }
};

var jsonInspect = '{"num":42,"payload":"money shot!","ip":"1.2.3.4","blob":"3q26yrrQ","one":{"list":[1,2]}}';
var jsonInspectNoIp = '{"num":42,"payload":"money shot!","ip":"AQIDBA==","blob":"3q26yrrQ","one":{"list":[1,2]}}';
var jsonInspectHex = '{"num":42,"payload":"money shot!","ip":"1.2.3.4","blob":"deadbacabad0","one":{"list":[1,2]}}';
var jsonInspectHexNoIp = '{"num":42,"payload":"money shot!","ip":"01020304","blob":"deadbacabad0","one":{"list":[1,2]}}';
var jsonInspectBinary = '{"num":42,"payload":"money shot!","ip":"1.2.3.4","blob":"\xDE\xAD\xBA\xCA\xBA\xD0","one":{"list":[1,2]}}';
var jsonInspectBinaryNoIp = '{"num":42,"payload":"money shot!","ip":"\\u0001\\u0002\\u0003\\u0004","blob":"\xDE\xAD\xBA\xCA\xBA\xD0","one":{"list":[1,2]}}';

var jsonInspectMp = '{"num":-0.5,"payload":"","ip":"0102030405060708090a0b0c0d0e0f10","blob":{"foo":"bar"},"one":{"list":[]}}';
var jsonInspectMpNoIp = '{"num":-0.5,"payload":"","ip":1,"blob":{"foo":"bar"},"one":{"list":[]}}';

var jsonInspectJSON = '{"num":0.5,"payload":"","ip":"0102030405060708090a0b0c0d0e0f10","blob":{"bar":"baz"},"one":{"list":[]}}';
var jsonInspectJSONNoIp = '{"num":0.5,"payload":"","ip":"AQIDBAUGBwgJCgsMDQ4PEA==","blob":{"bar":"baz"},"one":{"list":[]}}';

var jsonInspectJSONMpNoIp = '{"num":0.5,"payload":"","ip":1,"blob":{"bar":"baz"},"one":{"list":[]}}';

var nodeInspect = "{ num: 42,\n  payload: 'money shot!',\n  ip: '1.2.3.4',\n  blob: Buffer(6),\n  one: { list: [ 1, 2 ] } }";
var nodeInspectNoIp = "{ num: 42,\n  payload: 'money shot!',\n  ip: Buffer(4),\n  blob: Buffer(6),\n  one: { list: [ 1, 2 ] } }";
var nodeInspectHex = "{ num: 42,\n  payload: 'money shot!',\n  ip: '1.2.3.4',\n  blob: 'deadbacabad0',\n  one: { list: [ 1, 2 ] } }";
var nodeInspectHexNoIp = "{ num: 42,\n  payload: 'money shot!',\n  ip: '01020304',\n  blob: 'deadbacabad0',\n  one: { list: [ 1, 2 ] } }";
var nodeInspectBinary = "{ num: 42,\n  payload: 'money shot!',\n  ip: '1.2.3.4',\n  blob: '\xDE\xAD\xBA\xCA\xBA\xD0',\n  one: { list: [ 1, 2 ] } }";
var nodeInspectBinaryNoIp = "{ num: 42,\n  payload: 'money shot!',\n  ip: '\\u0001\\u0002\\u0003\\u0004',\n  blob: '\xDE\xAD\xBA\xCA\xBA\xD0',\n  one: { list: [ 1, 2 ] } }";

var nodeInspectMp = "{ num: -0.5,\n  payload: '',\n  ip: '0102030405060708090a0b0c0d0e0f10',\n  blob: { foo: 'bar' },\n  one: { list: [] } }";
var nodeInspectMpNoIp = "{ num: -0.5,\n  payload: '',\n  ip: 1,\n  blob: { foo: 'bar' },\n  one: { list: [] } }";

var nodeInspectJSON = "{ num: 0.5,\n  payload: '',\n  ip: '0102030405060708090a0b0c0d0e0f10',\n  blob: { bar: 'baz' },\n  one: { list: [] } }";
var nodeInspectJSONNoIp = "{ num: 0.5,\n  payload: '',\n  ip: 'AQIDBAUGBwgJCgsMDQ4PEA==',\n  blob: { bar: 'baz' },\n  one: { list: [] } }";

var nodeInspectJSONMpNoIp = "{ num: 0.5,\n  payload: '',\n  ip: 1,\n  blob: { bar: 'baz' },\n  one: { list: [] } }";

var binMessage = messages.Test.encode(jsonMessage);
var binMessageMp = messages.Test.encode(jsonMessageMp);
var binMessageJSON = messages.Test.encode(jsonMessageJSON);

test("inspect", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', protoPath], binMessage, jsonInspect);
  testCommandOutput(t, ['-C', protoPath], binMessage, nodeInspect);
});

test("inspect env", function(t) {
  t.plan(4);

  var env = {INSPECT_PROTOBUF: path.join(protoPath, 'Test')};

  testCommandOutput(t, ['-j'], binMessage, jsonInspect, {env: env});
  testCommandOutput(t, ['-C'], binMessage, nodeInspect, {env: env});
});

test("inspect no ip", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '--no-ip', protoPath], binMessage, jsonInspectNoIp);
  testCommandOutput(t, ['-C', '--no-ip', protoPath], binMessage, nodeInspectNoIp);
});

test("inspect hex", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '--bytes=hex', protoPath], binMessage, jsonInspectHex);
  testCommandOutput(t, ['-C', '--bytes=hex', protoPath], binMessage, nodeInspectHex);
});

test("inspect hex no ip", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '--bytes=hex', '--no-ip', protoPath], binMessage, jsonInspectHexNoIp);
  testCommandOutput(t, ['-C', '--bytes=hex', '--no-ip', protoPath], binMessage, nodeInspectHexNoIp);
});

test("inspect binary", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '--bytes=binary', protoPath], binMessage, jsonInspectBinary);
  testCommandOutput(t, ['-C', '--bytes=binary', protoPath], binMessage, nodeInspectBinary);
});

test("inspect binary no ip", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '--bytes=binary', '--no-ip', protoPath], binMessage, jsonInspectBinaryNoIp);
  testCommandOutput(t, ['-C', '--bytes=binary', '--no-ip', protoPath], binMessage, nodeInspectBinaryNoIp);
});

test("inspect mp", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '--msgpack', protoPath], binMessageMp, jsonInspectMp);
  testCommandOutput(t, ['-C', '--msgpack', protoPath], binMessageMp, nodeInspectMp);
});

test("inspect mp no ip", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '-m', '--no-ip', protoPath], binMessageMp, jsonInspectMpNoIp);
  testCommandOutput(t, ['-C', '-m', '--no-ip', protoPath], binMessageMp, nodeInspectMpNoIp);
});

test("inspect json", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '--json-bytes', protoPath], binMessageJSON, jsonInspectJSON);
  testCommandOutput(t, ['-C', '--json-bytes', protoPath], binMessageJSON, nodeInspectJSON);
});

test("inspect json no ip base64", function(t) {
  t.plan(4);

  testCommandOutput(t, ['-j', '-e', 'base64', '-b', '-I', protoPath], binMessageJSON, jsonInspectJSONNoIp);
  testCommandOutput(t, ['-C', '-e', 'base64', '-b', '-I', protoPath], binMessageJSON, nodeInspectJSONNoIp);
});

test("inspect mp+json", function(t) {
  t.plan(8);

  testCommandOutput(t, ['-j', '-m', '-b', protoPath], binMessageMp, jsonInspectMp);
  testCommandOutput(t, ['-j', '-m', '-b', protoPath], binMessageJSON, jsonInspectJSON);
  testCommandOutput(t, ['-C', '-m', '-b', protoPath], binMessageMp, nodeInspectMp);
  testCommandOutput(t, ['-C', '-m', '-b', protoPath], binMessageJSON, nodeInspectJSON);
});

test("inspect mp+json no ip", function(t) {
  t.plan(8);

  testCommandOutput(t, ['-j', '-m', '-b', '-I', protoPath], binMessageMp, jsonInspectMpNoIp);
  testCommandOutput(t, ['-j', '-m', '-b', '-I', protoPath], binMessageJSON, jsonInspectJSONMpNoIp);
  testCommandOutput(t, ['-C', '-m', '-b', '-I', protoPath], binMessageMp, nodeInspectMpNoIp);
  testCommandOutput(t, ['-C', '-m', '-b', '-I', protoPath], binMessageJSON, nodeInspectJSONMpNoIp);
});


function testCommandOutput(t, args, payload, expected, options) {
  runCmd(command, args, options, payload, Buffer.byteLength(expected), function(code, out) {
    t.strictEquals(code, 0);
    t.strictEquals(out.toString(), expected);
  });  
}
