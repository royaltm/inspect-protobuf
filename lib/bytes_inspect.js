"use strict";

var JSONParse = JSON.parse;

module.exports = exports = function installBytesInspect(decodeIp, encoding, json, msgpack) {
  var mpDecode = msgpack && require('msgpack-lite').decode;
  var toJSON;

  if (msgpack && json) {
    toJSON = function() {
      try {
        return JSONParse(this.toString());
      }
      catch(e) { }
      try {
        return mpDecode(this);
      }
      catch(e) { }
      return this.toString(encoding);
    };
  }
  else if (msgpack) {
    toJSON = function() {
      try {
        return mpDecode(this);
      }
      catch(e) { }
      return this.toString(encoding);
    };
  }
  else if (json) {
    toJSON = function() {
      try {
        return JSONParse(this.toString());
      }
      catch(e) { }
      return this.toString(encoding);
    };
  }
  else {
    toJSON = function() {
      return this.toString(encoding);
    };
  }

  /* monkey-patch Buffer#toJSON */
  if (decodeIp) {
    Buffer.prototype.toJSON = function() {
      var len = this.length;
      if (len === 4) { /* 4-byte blob, assume IP address */
        return this[0] + '.' + this[1] + '.' + this[2] + '.' + this[3];
      } else if (len === 16) {
        return this.toString('hex');
      } else {
        return toJSON.call(this);
      }
    };
  }
  else {
    Buffer.prototype.toJSON = toJSON;
  }

};
