// META: global=window,worker,shadowrealm
// META: script=../resources/test-utils.js
// META: script=../resources/recording-streams.js
'use strict';

const error1 = { name: 'error1' };

test(() => {
  const passedError = new Error('horrible things');

  let writeCalled = false;
  let closeCalled = false;
  assert_throws_exactly(passedError, () => {
    // recordingWritableStream cannot be used here because the exception in the
    // constructor prevents assigning the object to a variable.
    new WritableStream({
      start() {
        throw passedError;
      },
      write() {
        writeCalled = true;
      },
      close() {
        closeCalled = true;
      }
    });
  }, 'constructor should throw passedError');
  assert_false(writeCalled, 'write should not be called');
  assert_false(closeCalled, 'close should not be called');
}, 'underlying sink\'s write or close should not be called if start throws');
