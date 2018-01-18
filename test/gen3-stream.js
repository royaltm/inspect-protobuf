#!/usr/bin/env node
'use strict';

var fs = require('fs')
  , path = require('path')
  , crypto = require('crypto');

var protoPath = path.join(__dirname, 'test3.proto');

var messages = require('protobufjs').parse(fs.readFileSync(protoPath)).root;

var proto = messages.lookupType('foosome.Test');

var Long = require('long');

var counter = 0;
var scroll = " money shot!!!";

function genMessage() {
  scroll = scroll.substr(1) + scroll.substr(0, 1);
  return {
    "num": counter++,
    "payload": scroll,
    "ip": crypto.randomBytes(4),
    "blob": crypto.randomBytes(Math.random()*1000|0),
    "one": {
      "list": [1 + (Math.random()*2|0)],
      "values": {"key": scroll}
    },
    "long": new Long(Math.random()*0x100000000>>>0, Math.random()*0x100000000>>>0)
  };
}

var total = parseInt(process.argv[2]);
if (!isFinite(total)) total = 0;

function forever() {
  if (total-- > 0) {
    setImmediate(function() {
      var msg = genMessage();
      var blob = proto.encode(proto.create(msg)).finish();
      process.stdout.write(blob.length + ' ');
      process.stdout.write(blob);
      forever();
    });
  }
}

forever();
