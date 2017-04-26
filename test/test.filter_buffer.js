'use strict';

var test = require("tap").test;
var FilterBuffer = require("../lib/filter_buffer");

test("should be a function", function(t) {
  t.type(FilterBuffer, 'function');
  t.end();
});

test("should find expected string", function(t) {
  t.plan(3);
  var sb = new FilterBuffer().
    expect('Łódź', function(buffer, sbuf) {
      t.type(buffer, Buffer);
      t.strictEqual(buffer.toString(), 'Łódź');
      t.strictEqual(sbuf.cursor, sbuf.length - 3);
    }).
    write(new Buffer('Łódźxyz'));
});

test("should get rest of the buffer", function(t) {
  t.plan(5);
  var sb = new FilterBuffer().
    expect('sometext', function(buffer, sbuf) {
      t.fail('this is not expected');
    }).
    expect(function(buffer, sbuf) {
      t.type(buffer, Buffer);
      t.strictEqual(buffer.toString(), 'alamakota');
      t.strictEqual(sbuf.cursor, 0);
      t.strictEqual(sbuf.length, buffer.length);
      t.strictEqual(sbuf.length, 'alamakota'.length);
    }).
    end(new Buffer('alamakota'));
});

test("should transform accordingly", function(t) {
  t.plan(10);

  var sb = new FilterBuffer().
    expect('Łódź', function(buffer, sbuf) {
      t.type(buffer, Buffer);
      t.strictEqual(buffer.toString(), 'Łódź');
      t.strictEqual(sbuf.cursor, 7);
      sbuf.cut();
      return 'ALA';
    }).
    expect(/\$(\d\d)/, function(match, sbuf) {
      t.strictEqual(parseInt(match[1]), 12);
      sbuf.cut();
    }).
    expect(function(ch) { return ch == 42; }, function(buffer, sbuf) {
      t.strictEqual(buffer.toString(), '*');
      sbuf.cut().
      expect(12, function(buffer, sbuf) {
        t.type(buffer, Buffer);
        t.strictEqual(buffer.toString(), 'ABCDEFGHIJKL');
        sbuf.reset().expect(function(buffer, sbuf) {
          t.type(buffer, Buffer);
          t.strictEqual(buffer.toString(), 'ABCDEFGHIJKLMNOPQR');
          return 'KOTA';
        });
        return 'MA';
      });
    });

  sb.setEncoding('utf8');
  sb.end(new Buffer('Łódź$12*ABCDEFGHIJKLMNOPQR'));

  sb.once('readable', function(data) {
    setImmediate(function() {
      t.strictEqual(sb.read(9), 'ALAMAKOTA');
    });
  });
});
