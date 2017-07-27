'use strict';

if (self.importScripts) {
  self.importScripts('../resources/test-utils.js');
  self.importScripts('/resources/testharness.js');
}

let ReadableStreamDefaultReader;
let ReadableStreamDefaultController;

test(() => {

  // It's not exposed globally, but we test a few of its properties here.
  ReadableStreamDefaultReader = (new ReadableStream()).getReader().constructor;

}, 'Can get the ReadableStreamDefaultReader constructor indirectly');

test(() => {

  // It's not exposed globally, but we test a few of its properties here.
  new ReadableStream({
    start(c) {
      ReadableStreamDefaultController = c.constructor;
    }
  });

}, 'Can get the ReadableStreamDefaultController constructor indirectly');

function fakeReadableStream() {
  return Object.setPrototypeOf({
    cancel() { return Promise.resolve(); },
    getReader() { return new ReadableStreamDefaultReader(new ReadableStream()); },
    pipeThrough(obj) { return obj.readable; },
    pipeTo() { return Promise.resolve(); },
    tee() { return [realReadableStream(), realReadableStream()]; }
  }, ReadableStream.prototype);
}

function realReadableStream() {
  return new ReadableStream();
}

function fakeReadableStreamDefaultReader() {
  return Object.setPrototypeOf({
    get closed() { return Promise.resolve(); },
    cancel() { return Promise.resolve(); },
    read() { return Promise.resolve({ value: undefined, done: true }); },
    releaseLock() { return; }
  }, ReadableStreamDefaultReader.prototype);
}

function fakeReadableStreamDefaultController() {
  return Object.setPrototypeOf({
    close() { },
    enqueue() { },
    error() { }
  }, ReadableStreamDefaultController.prototype);
}

promise_test(t => {

  return methodRejects(t, ReadableStream.prototype, 'cancel', fakeReadableStream());

}, 'ReadableStream.prototype.cancel enforces a brand check');

test(() => {

  methodThrows(ReadableStream.prototype, 'getReader', fakeReadableStream());

}, 'ReadableStream.prototype.getReader enforces a brand check');

test(() => {

  methodThrows(ReadableStream.prototype, 'tee', fakeReadableStream());

}, 'ReadableStream.prototype.tee enforces a brand check');

test(() => {

  assert_throws(new TypeError(), () => new ReadableStreamDefaultReader(fakeReadableStream()),
                'Constructing a ReadableStreamDefaultReader should throw');

}, 'ReadableStreamDefaultReader enforces a brand check on its argument');

promise_test(t => {

  return Promise.all([
    getterRejects(t, ReadableStreamDefaultReader.prototype, 'closed', fakeReadableStreamDefaultReader()),
    getterRejects(t, ReadableStreamDefaultReader.prototype, 'closed', realReadableStream())
  ]);

}, 'ReadableStreamDefaultReader.prototype.closed enforces a brand check');

promise_test(t => {

  return Promise.all([
    methodRejects(t, ReadableStreamDefaultReader.prototype, 'cancel', fakeReadableStreamDefaultReader()),
    methodRejects(t, ReadableStreamDefaultReader.prototype, 'cancel', realReadableStream())
  ]);

}, 'ReadableStreamDefaultReader.prototype.cancel enforces a brand check');

promise_test(t => {

  return Promise.all([
    methodRejects(t, ReadableStreamDefaultReader.prototype, 'read', fakeReadableStreamDefaultReader()),
    methodRejects(t, ReadableStreamDefaultReader.prototype, 'read', realReadableStream())
  ]);

}, 'ReadableStreamDefaultReader.prototype.read enforces a brand check');

test(() => {

  methodThrows(ReadableStreamDefaultReader.prototype, 'releaseLock', fakeReadableStreamDefaultReader());
  methodThrows(ReadableStreamDefaultReader.prototype, 'releaseLock', realReadableStream());

}, 'ReadableStreamDefaultReader.prototype.releaseLock enforces a brand check');

test(() => {

  assert_throws(new TypeError(), () => new ReadableStreamDefaultController(fakeReadableStream()),
                'Constructing a ReadableStreamDefaultController should throw');

}, 'ReadableStreamDefaultController enforces a brand check on its argument');

test(() => {

  assert_throws(new TypeError(), () => new ReadableStreamDefaultController(realReadableStream()),
                'Constructing a ReadableStreamDefaultController should throw');

}, 'ReadableStreamDefaultController can\'t be given a fully-constructed ReadableStream');

test(() => {

  methodThrows(ReadableStreamDefaultController.prototype, 'close', fakeReadableStreamDefaultController());

}, 'ReadableStreamDefaultController.prototype.close enforces a brand check');

test(() => {

  methodThrows(ReadableStreamDefaultController.prototype, 'enqueue', fakeReadableStreamDefaultController());

}, 'ReadableStreamDefaultController.prototype.enqueue enforces a brand check');

test(() => {

  methodThrows(ReadableStreamDefaultController.prototype, 'error', fakeReadableStreamDefaultController());

}, 'ReadableStreamDefaultController.prototype.error enforces a brand check');

done();
