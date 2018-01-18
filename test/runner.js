"use strict";

var fork = require('child_process').fork;

module.exports = exports = function runCmd(command, args, options, payload, readsize, callback) {
  var exitCode, out;

  options || (options = {});
  options.stdio = ['pipe', 'pipe', process.stderr, 'ipc'];

  var child = fork(command, args, options);

  function exit(code, signal) {
    exitCode = code == null ? signal : code;
    if (out) callback(exitCode, out);
  }

  function readable() {
    out = child.stdout.read(readsize);
    if (out) {
      child.stdout.removeListener('readable', readable);
      if (exitCode) callback(exitCode, out);
    }
  }

  child.stdout.on('readable', readable);
  child.once('exit', exit);
  child.stdin.end(payload);
};
