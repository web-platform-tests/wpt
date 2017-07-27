'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
  self.importScripts('../resources/test-utils.js');
}

const ws = new WritableStream();
const writer = ws.getWriter();
const WritableStreamDefaultWriter = writer.constructor;
const WriterProto = WritableStreamDefaultWriter.prototype;
const WritableStreamDefaultController = getWritableStreamDefaultControllerConstructor();

function getWritableStreamDefaultControllerConstructor() {
  return realWSDefaultController().constructor;
}

function fakeWS() {
  return Object.setPrototypeOf({
    get locked() { return false; },
    abort() { return Promise.resolve(); },
    getWriter() { return fakeWSDefaultWriter(); }
  }, WritableStream.prototype);
}

function realWS() {
  return new WritableStream();
}

function fakeWSDefaultWriter() {
  return Object.setPrototypeOf({
    get closed() { return Promise.resolve(); },
    get desiredSize() { return 1; },
    get ready() { return Promise.resolve(); },
    abort() { return Promise.resolve(); },
    close() { return Promise.resolve(); },
    write() { return Promise.resolve(); }
  }, WritableStreamDefaultWriter.prototype);
}

function realWSDefaultWriter() {
  const ws = new WritableStream();
  return ws.getWriter();
}

function fakeWSDefaultController() {
  return Object.setPrototypeOf({
    error() { return Promise.resolve(); }
  }, WritableStreamDefaultController.prototype);
}

function realWSDefaultController() {
  let controller;
  new WritableStream({
    start(c) {
      controller = c;
    }
  });
  return controller;
}

test(() => {
  getterThrowsForAll(WritableStream.prototype, 'locked',
                     [fakeWS(), realWSDefaultWriter(), realWSDefaultController()]);
}, 'WritableStream.prototype.locked enforces a brand check');

promise_test(t => {
  return methodRejectsForAll(t, WritableStream.prototype, 'abort',
                             [fakeWS(), realWSDefaultWriter(), realWSDefaultController()]);
}, 'WritableStream.prototype.abort enforces a brand check');

test(t => {
  methodThrowsForAll(WritableStream.prototype, 'getWriter',
                     [fakeWS(), realWSDefaultWriter(), realWSDefaultController()]);
}, 'WritableStream.prototype.getWriter enforces a brand check');

test(() => {
  getterThrowsForAll(WriterProto, 'desiredSize',
                     [fakeWSDefaultWriter(), realWS(), realWSDefaultController()]);
}, 'WritableStreamDefaultWriter.prototype.desiredSize enforces a brand check');

promise_test(t => {
  return getterRejectsForAll(t, WriterProto, 'closed',
                             [fakeWSDefaultWriter(), realWS(), realWSDefaultController()]);
}, 'WritableStreamDefaultWriter.prototype.closed enforces a brand check');

promise_test(t => {
  return getterRejectsForAll(t, WriterProto, 'ready',
                             [fakeWSDefaultWriter(), realWS(), realWSDefaultController()]);
}, 'WritableStreamDefaultWriter.prototype.ready enforces a brand check');

promise_test(t => {
  return methodRejectsForAll(t, WriterProto, 'abort',
                             [fakeWSDefaultWriter(), realWS(), realWSDefaultController()]);
}, 'WritableStreamDefaultWriter.prototype.abort enforces a brand check');

promise_test(t => {
  return methodRejectsForAll(t, WriterProto, 'write',
                             [fakeWSDefaultWriter(), realWS(), realWSDefaultController()]);
}, 'WritableStreamDefaultWriter.prototype.write enforces a brand check');

promise_test(t => {
  return methodRejectsForAll(t, WriterProto, 'close',
                             [fakeWSDefaultWriter(), realWS(), realWSDefaultController()]);
}, 'WritableStreamDefaultWriter.prototype.close enforces a brand check');

done();
