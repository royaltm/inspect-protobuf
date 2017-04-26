#!/usr/bin/env node
'use strict';

var fs = require('fs')
  , path = require('path')
  , crypto = require('crypto');

var protoPath = path.join(__dirname, 'test.proto');

var messages = require('protocol-buffers')(fs.readFileSync(protoPath));

var proto = messages.Test;

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
      "list": [1 + (Math.random()*2|0)]
    }
  };
}

var total = parseInt(process.argv[2]);
if (!isFinite(total)) total = 0;

function forever() {
  if (total-- > 0) {
    setImmediate(function() {
      var blob = proto.encode(genMessage());
      process.stdout.write(blob.length + ' ');
      process.stdout.write(blob);
      forever();
    });
  }
}

forever();
