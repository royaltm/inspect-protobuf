"use strict";

var JSONParse = JSON.parse;

var inspect = require('util').inspect;

var inspectKey = inspect.custom || 'inspect';

exports.installInspect = function(protoVersion, decodeIp, encoding, json, msgpack) {
  var mpDecode = msgpack && require('msgpack-lite').decode;

  var customInspect;

  if (protoVersion === 3) {
    var Long = require("long");
    Long.prototype[inspectKey] = function() { return this.toString(); };
  }

  if (msgpack && json) {
    customInspect = function(depth, opt) {
      try {
        return inspect(JSONParse(this.toString()), opt);
      }
      catch(e) { }
      try {
        return inspect(mpDecode(this), opt);
      }
      catch(e) { }
      return inspect(this.toString(encoding), opt);
    };
  }
  else if (msgpack) {
    customInspect = function(depth, opt) {
      try {
        return inspect(mpDecode(this), opt);
      }
      catch(e) { }
      return inspect(this.toString(encoding), opt);
    };
  }
  else if (json) {
    customInspect = function(depth, opt) {
      try {
        return inspect(JSONParse(this.toString()), opt);
      }
      catch(e) { }
      return inspect(this.toString(encoding), opt);
    };
  }
  else if (encoding) {
    customInspect = function(depth, opt) {
      return inspect(this.toString(encoding), opt);
    };
  }
  else {
    customInspect = function(depth, opt) {
      return "Buffer(" + this.length + ")";
    };
  }

  if (decodeIp) {
    Buffer.prototype[inspectKey] = function(depth, opt) {
      var len = this.length;
      if (len === 4) { /* 4-byte blob, assume IP address */
        return inspect(this[0] + '.' + this[1] + '.' + this[2] + '.' + this[3], opt);
      } else if (len === 16) {
        return inspect(this.toString('hex'), opt);
      } else {
        return customInspect.call(this, depth, opt);
      }
    };
  }
  else {
    Buffer.prototype[inspectKey] = customInspect;
  }
};

exports.installToJson = function(protoVersion, decodeIp, encoding, json, msgpack) {
  var mpDecode = msgpack && require('msgpack-lite').decode;

  var toJSON;

  if (protoVersion === 3) {
    var Long = require("long");
    Long.prototype.toJSON = function() { return this.toString(); };
  }

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
      return this.toString(encoding || 'base64');
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
