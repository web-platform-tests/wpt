// DO NOT EDIT! This test has been generated by /html/canvas/tools/gentest.py.
// OffscreenCanvas test in a worker:2d.line.join.invalid
// Description:Setting lineJoin to invalid values is ignored
// Note:

importScripts("/resources/testharness.js");
importScripts("/html/canvas/resources/canvas-tests.js");

var t = async_test("Setting lineJoin to invalid values is ignored");
var t_pass = t.done.bind(t);
var t_fail = t.step_func(function(reason) {
    throw reason;
});
t.step(function() {

  var canvas = new OffscreenCanvas(100, 50);
  var ctx = canvas.getContext('2d');

  ctx.lineJoin = 'bevel'
  _assertSame(ctx.lineJoin, 'bevel', "ctx.lineJoin", "'bevel'");

  ctx.lineJoin = 'bevel';
  ctx.lineJoin = 'invalid';
  _assertSame(ctx.lineJoin, 'bevel', "ctx.lineJoin", "'bevel'");

  ctx.lineJoin = 'bevel';
  ctx.lineJoin = 'ROUND';
  _assertSame(ctx.lineJoin, 'bevel', "ctx.lineJoin", "'bevel'");

  ctx.lineJoin = 'bevel';
  ctx.lineJoin = 'round\0';
  _assertSame(ctx.lineJoin, 'bevel', "ctx.lineJoin", "'bevel'");

  ctx.lineJoin = 'bevel';
  ctx.lineJoin = 'round ';
  _assertSame(ctx.lineJoin, 'bevel', "ctx.lineJoin", "'bevel'");

  ctx.lineJoin = 'bevel';
  ctx.lineJoin = "";
  _assertSame(ctx.lineJoin, 'bevel', "ctx.lineJoin", "'bevel'");

  ctx.lineJoin = 'bevel';
  ctx.lineJoin = 'butt';
  _assertSame(ctx.lineJoin, 'bevel', "ctx.lineJoin", "'bevel'");
  t.done();
});
done();