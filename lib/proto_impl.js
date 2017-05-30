"use strict";

var fs = require('fs');

module.exports = exports = function acquireProtobufDecoder(version, file, messageName, callback) {
  var result
    , MsgType
    , protobuf = (version === 3) ? require('protobufjs')
                                 : require('protocol-buffers');

  fs.readFile(file, 'utf8', function(err, proto) {
    if (err) return callback(err);

    try {
      if (version === 3) {

        try {
          MsgType = protobuf.parse(proto);
        } catch(err) {
          throw new Error("Error: could not parse proto file: " + JSON.stringify(file));
        }

        if (!messageName) {
          MsgType = findFirstNestedType(MsgType.root.nested, protobuf.Type, protobuf.Namespace);
        } else {
          try {
            MsgType = MsgType.root.lookupType(messageName);
          } catch(err) {
            MsgType = null;
          }
        }

        if (MsgType && 'function' === typeof MsgType.decode) {
          result = function(data) {
            return MsgType.toObject(MsgType.decode(data));
          };
        }

      }
      else {

        try {
          MsgType = protobuf(proto);
        } catch(err) {
          throw new Error("Error: could not parse proto file: " + JSON.stringify(file));
        }

        if (!messageName) {
          Object.keys(MsgType).some(function(name) {
            var msg = MsgType[name];
            if (msg && 'function' === typeof msg.decode) {
              messageName = name;
              return true;
            }
          });
        }

        MsgType = MsgType[messageName];
        if (MsgType) result = MsgType.decode;
      }

      if ('function' !== typeof result) {
        throw new Error('Error: no such protobuf message: ' + JSON.stringify(messageName));
      }

      callback(null, result);
    } catch(err) {
      return callback(err);
    }
  });
};

function findFirstNestedType(obj, Type, Namespace) {
  var result;
  Object.keys(obj).some(function(name) {
    var msg = obj[name];
    if (msg instanceof Type) {
      result = msg;
      return true;
    }
    else if (msg instanceof Namespace) {
      result = findFirstNestedType(msg, Type, Namespace);
      return result !== undefined;
    }
  });

  return result;
}
