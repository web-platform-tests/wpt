"use strict";

test(() => {
  assert_equals(typeof queueMicrotask, "function");
}, "It exists and is a function");

test(() => {
  assert_throws(new TypeError(), () => queueMicrotask(), "no argument");
  assert_throws(new TypeError(), () => queueMicrotask(undefined), "undefined");
  assert_throws(new TypeError(), () => queueMicrotask(null), "null");
  assert_throws(new TypeError(), () => queueMicrotask(0), "0");
  assert_throws(new TypeError(), () => queueMicrotask({ handleEvent() { } }), "an event handler object");
  assert_throws(new TypeError(), () => queueMicrotask("window.x = 5;"), "a string");
}, "It throws when given non-functions");

async_test(t => {
  let called = false;
  queueMicrotask(() => {
    called = true;
    t.done();
  });
  assert_false(called);
}, "It calls the callback asynchronously");

async_test(t => {
  queueMicrotask(function () {
    assert_array_equals(arguments, []);
    t.done();
  }, "x", "y");
}, "It does not pass any arguments");

async_test(t => {
  const happenings = [];
  Promise.resolve().then(() => happenings.push("a"));
  queueMicrotask(() => happenings.push("b"));
  Promise.reject().catch(() => happenings.push("c"));
  queueMicrotask(() => {
    assert_array_equals(happenings, ["a", "b", "c"]);
    t.done();
  });
}, "It interleaves with promises as expected");
