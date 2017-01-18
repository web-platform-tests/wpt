'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
  self.importScripts('../resources/rs-utils.js');
}

function duckTypedPassThroughTransform() {
  let enqueueInReadable;
  let closeReadable;

  return {
    writable: new WritableStream({
      write(chunk) {
        enqueueInReadable(chunk);
      },

      close() {
        closeReadable();
      }
    }),

    readable: new ReadableStream({
      start(c) {
        enqueueInReadable = c.enqueue.bind(c);
        closeReadable = c.close.bind(c);
      }
    })
  };
}

promise_test(() => {
  const readableEnd = sequentialReadableStream(5).pipeThrough(duckTypedPassThroughTransform());

  return readableStreamToArray(readableEnd).then(chunks =>
    assert_array_equals(chunks, [1, 2, 3, 4, 5]), 'chunks should match');
}, 'Piping through a duck-typed pass-through transform stream should work');

done();
