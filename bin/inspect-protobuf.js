#!/usr/bin/env node
/*
 * TOOL inspect protobuf
 *
 * Author: Rafal Michalski (c) 2017
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

var InspectTypes = {
  color: function(obj) {
    return inspect(obj, {depth: null, colors: true}) + "\n\n";
  },
  mono: function(obj) {
    return inspect(obj, {depth: null, colors: false}) + "\n\n";
  },
  json: function(obj) {
    return JSON.stringify(obj) + "\n";
  }
};

/* read from args */
var inspectTool
  , protoMessage;
 
program
  .version('1.0.0')
  .usage('[options] <proto-file> <ProtoMessageName>')
  .option('-j, --json', 'json output')
  .option('-C, --no-color', 'monochrome inspect output')
  .parse(process.argv);

parseArgs.apply(null, program.args);

function parseArgs(file, message_name) {
  var protoPath = process.env.INSPECT_PROTOBUF
    , messages;

  try {
    if ('string' === typeof protoPath && protoPath.length !== 0) {
      message_name || (message_name = path.basename(protoPath));
      file || (file = path.dirname(protoPath));
    }

    if (!file) {
      console.error('\nError: No proto file specified');
      process.exit(1);
    }

    messages = protobuf(fs.readFileSync(file));

  } catch(e) {
    console.error('\nError accesing: ' + JSON.stringify(file) + ' ' + e.message);
    process.exit(2);
  }

  if (!message_name) {
    Object.keys(messages).some(function(name) {
      var msg = messages[name];
      if (msg && 'function' === typeof msg.decode) {
        message_name = name;
        return true;
      }
    });
  }

  protoMessage = messages[message_name];

  if (!protoMessage || 'function' !== typeof protoMessage.decode) {
    console.error('\nError: no such protobuf message: ' + JSON.stringify(message_name));
    process.exit(3);
  }

}

if (program.json) {
  inspectTool = InspectTypes.json;
}
else {
  inspectTool = program.color ? InspectTypes.color
                              : InspectTypes.mono
}

/* monkey-patch Buffer#toJSON */
Buffer.prototype.toJSON = function() {
  if (this.length === 4) { /* 4-byte blob, assume IP address */
    return this[0] + '.' + this[1] + '.' + this[2] + '.' + this[3];
  } else {
    return this.toString('hex');
  }
};

var c0 = '0'.charCodeAt(0)
  , c9 = '9'.charCodeAt(0)

function processData(buffer) {
  var msg;
  try {
    msg = protoMessage.decode(buffer);
  } catch(err) {
    msg = {"Error": err.toString()};
  }

  return inspectTool(msg);
}


var transformer = new FilterBuffer();

header(transformer);

/* in case header will not match just process the whole data as a single message */
transformer.expect(processData);


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

process.stdin.pipe(transformer).pipe(process.stdout);
