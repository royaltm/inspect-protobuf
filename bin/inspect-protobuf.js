#!/usr/bin/env node
"use strict";

/*
 * inspect protobuf
 *
 * Author: Rafal Michalski (c) 2017-2018
 *
 * Usage:
 *
 * kafkacat -C ... -f '%S %s' | inspect-protobuf PROTO_FILE MESSAGE_NAME
 *
*/

var fs = require('fs')
  , path = require('path')
  , inspect = require('util').inspect;

var protobuf = require('protocol-buffers')
  , program = require('commander');

var FilterBuffer = require('../lib/filter_buffer');

var acquireProtobufDecoder = require('../lib/proto_impl');

var convertTypes = require('../lib/convert_types');

var colorInspectOpts = {depth: null, colors: true};
var monoInspectOpts = {depth: null, colors: false};

var InspectTypes = {
  color: function(obj) {
    return inspect(obj, colorInspectOpts) + "\n\n";
  },
  mono: function(obj) {
    return inspect(obj, monoInspectOpts) + "\n\n";
  },
  json: function(obj) {
    return JSON.stringify(obj) + "\n";
  }
};

/* read from args */
var inspectTool
  , protoVersion
  , protoFile
  , messageName;
 
program
  .version('1.1.0')
  .usage('[options] <proto-file> <ProtoMessageName>')
  .option('-j, --json', 'json output')
  .option('-C, --no-color', 'monochrome inspect output')
  .option('-3, --proto-3', 'use protobufjs parser (proto-3 support)')
  .option('-I, --no-ip', 'do not decode 4 or 16 bytes as ip addresses')
  .option('-e, --bytes <encoding>', 'decode bytes as strings with encoding')
  .option('-m, --msgpack', 'decode bytes with MessagePack')
  .option('-b, --json-bytes', 'decode bytes as JSON strings')
  .parse(process.argv);

parseArgs.apply(null, program.args);

function parseArgs(file, name) {
  var protoPath = process.env.INSPECT_PROTOBUF;

  if ('string' === typeof protoPath && protoPath.length !== 0) {
    name || (name = path.basename(protoPath));
    file || (file = path.dirname(protoPath));
  }

  if (!file) {
    console.error('\nError: No proto file specified');
    process.exit(1);
  }

  protoFile = file;
  messageName = name;
}

protoVersion = (program.proto3 ? 3 : 2);

if (program.json) {
  inspectTool = InspectTypes.json;

  convertTypes.installToJson(protoVersion, program.ip, program.bytes, program.jsonBytes, program.msgpack);
}
else {
  inspectTool = program.color ? InspectTypes.color
                              : InspectTypes.mono

  convertTypes.installInspect(protoVersion, program.ip, program.bytes, program.jsonBytes, program.msgpack)
}

var c0 = '0'.charCodeAt(0)
  , c9 = '9'.charCodeAt(0)

function matchDecimalTerminateAt(term) {
  var notAtTerm = true;
  return function(ch) {
    if (notAtTerm) {
      if (ch >= c0 && ch <= c9) {
        return true;
      } else if (ch === term) {
        notAtTerm = false;
        return true;
      }
    }
    return false;
  }
}

/* Main */

acquireProtobufDecoder(protoVersion, protoFile, messageName, function(err, protoDecode) {
  if (err) {
    console.error('\n%s', err.message);
    process.exit(2);
  }

  var transformer = new FilterBuffer();

  header(transformer);

  /* in case header will not match just process the whole data as a single message */
  transformer.expect(processData);

  process.stdin.pipe(transformer).pipe(process.stdout);

  function processData(buffer) {
    var msg;
    try {
      msg = protoDecode(buffer);
    } catch(err) {
      msg = {"Error": err.toString()};
    }

    return inspectTool(msg);
  }

  function header(transformer) {
    transformer.
    expect(matchDecimalTerminateAt(32), function(matchBuffer, transformer) {
      var dataSize = parseInt(matchBuffer.toString('ascii', 0, matchBuffer.length - 1));
      if (isNaN(dataSize)) {
        throw new Error("invalid header format");
      } else {
        transformer.cut().reset().
        expect(dataSize, function(matchBuffer, transformer) {
          header(transformer.cut().reset());
          transformer.expect(function(ch) {
            return (ch < c0 || ch > c9) && ch !== 32;
          }, function(data, transformer) {
            throw new Error("invalid header format");
          });
          return processData(matchBuffer);
        });
      }
    })
  }

});
