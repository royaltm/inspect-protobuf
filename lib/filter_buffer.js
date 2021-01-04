"use strict";

var stream = require('stream');
var util = require('util');

var Transform = stream.Transform;

util.inherits(FilterBuffer, Transform);

module.exports = exports = FilterBuffer;

function FilterBuffer(options) {
  options || (options = {});
  options.decodeStrings = true;
  Transform.call(this, options);

  this.buffers = [];
  this.expectations = [];
  this.deferred = null;
  this.cursor = 0;
  this.length = 0;
  this.isEnd = false;
}

FilterBuffer.prototype._flush = function(cb) {
  checkExpectations(this, this.isEnd = true);

  var buf = this;
  setImmediate(deferFlush);

  function deferFlush() {
    if (buf.deferred)
      setImmediate(deferFlush);
    else
      cb();
  }
};

FilterBuffer.prototype._transform = function(buffer, enc, cb) {
  this.buffers.push(buffer);
  this.length += buffer.length;
  checkExpectations(this, false);
  cb();
};

/*
FilterBuffer.prototype.getBuffer = function(offset) {
  if ('number' !== typeof offset) offset = this.cursor;
  var buffer = getBuffer(this);
  return (offset > 0) ? buffer.slice(offset) : buffer;
}
*/
function getBuffer(buf) {
  var buffers = buf.buffers
    , buffer = Buffer.concat(buffers, buf.length);
  if (buffers[0] !== buffer)
    buffers.splice(0, buffers.length, buffer);
  return buffer;
}

FilterBuffer.prototype.cut = function(offset) {
  if ('number' !== typeof offset) offset = this.cursor;
  if (offset > 0) {
    this.cursor = 0;
    if (offset >= this.length) {
      this.buffers.length = 0;
      this.length = 0;
    } else {
      var buffer = getBuffer(this);
      this.buffers[0] = buffer.slice(offset);
      this.length -= offset;
      deferCheckExpectations(this);
    }
  }
  return this;
};

FilterBuffer.prototype.reset = function() {
  this.expectations.length = 0;
  clearDeferred(this);
  return this;
};

FilterBuffer.prototype.expect = function(filter, callback) {
  if (arguments.length == 1)
    callback = filter, filter = null;

  var type, buf = this;

  switch(typeof filter) {
    case 'string':
      filter = Buffer.from(filter);
      type = checkBufferExpectation;
      break;
    case 'object':
      if (filter === null) {
        type = checkEndExpectation;
        break;
      } else if (filter instanceof RegExp) {
        type = checkRegexpExpectation;
        break;
      } else if (filter instanceof Buffer) {
        type = checkBufferExpectation;
        break;
      }
    case 'function':
      type = checkByteExpectation;
      break;
    case 'number':
      type = checkSizeExpectation;
      break;
    default:
      throw new Error("unknown expectation filter");
  }

  callback = handler(buf, callback);

  this.expectations.push(function(isEnd) {
    return type(buf, filter, isEnd, callback);
  });
  return deferCheckExpectations(buf);
};

function handler(buf, callback) {
  return function() {
    var result = callback.apply(null, arguments);
    if ('undefined' !== typeof result) {
      buf.push(result);
    }
    return true;
  }
}

function deferCheckExpectations(buf) {
  if (buf.deferred == null)
    buf.deferred = setImmediate(checkExpectations, buf, buf.isEnd);
  return buf;
}

function clearDeferred(buf) {
  if (buf.deferred) {
    clearImmediate(buf.deferred);
    buf.deferred = null;
  }
}

function checkExpectations(buf, isEnd) {
  clearDeferred(buf);
  buf.expectations.slice().some(function(expectation, i) {
    return expectation(isEnd);
  });
  return buf;
}

function checkEndExpectation(buf, filter, isEnd, callback) {
  if (isEnd) {
    return callback(getBuffer(buf), buf);
  }
}

function checkBufferExpectation(buf, filter, isEnd, callback) {
  var length = filter.length
    , buffer = getBuffer(buf);

  if (length <= buffer.length)
    buffer = buffer.slice(0, length);

  if (buffer.equals(filter)) {
    buf.cursor = buffer.length;
    return callback(buffer, buf);
  }
}

function checkRegexpExpectation(buf, filter, isEnd, callback) {
  var string = getBuffer(buf).toString()
    , match = string.match(filter);
  if (match) {
    buf.cursor = Buffer.byteLength(string.slice(0, match.index)) + 
                 Buffer.byteLength(match[0]);
    return callback(match, buf);
  }
}

function checkSizeExpectation(buf, size, isEnd, callback) {
  if (buf.length >= size) {
    var buffer = getBuffer(buf);
    buf.cursor = size;
    return callback(size < buffer.length ? buffer.slice(0, size) : buffer, buf);
  }
}

function checkByteExpectation(buf, filter, isEnd, callback) {
  var buffer = getBuffer(buf);
  for(var cursor = buf.cursor, length = buf.length;
          cursor < length;
        ++cursor) {

    if (!filter(buffer[cursor]))
      break;
  }
  buf.cursor = cursor;
  if (cursor > 0) {
    if (cursor < length || isEnd)
      callback(buffer.slice(0, cursor), buf);
    return true;
  }
}
