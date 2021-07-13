'use strict';

// Checks if the condition is true. If it is false, the error message is sent to
// the main thread to let the test fail. This function cannot use {assert_true}
// because it will be executed on the worker where {assert_true} is not
// available.
function check(condition, message) {
  if (!condition) {
    self.postMessage({'result': message});
    return false;
  }
  return true;
}

// Executes {test} in the context of the worker. {test} has to be a function
// with name "test", which takes the SyncAccessHandle as parameter.
async function testContainer(t, rootDir, test) {
  let resolve;
  // Create a promise which fulfills when the worker finishes.
  let promise = new Promise(function(res, rej) {
    resolve = res;
  });

  // Construct the source code of the worker. It consists of the code of {test},
  // the code of {check}, and a small wrapper that takes care of the interaction
  // with the main thread.
  let blobURL = URL.createObjectURL(new Blob(
      [
        test.toString(),
        check.toString(),
        '(',
        function() {
          self.addEventListener('message', async (e) => {
            try {
              const fileHandle = e.data.fileHandle;
              const handle = await fileHandle.createSyncAccessHandle();
              test(handle);
              self.postMessage({'result': 'Test passed'});
            } catch (e) {
              return check(false, e);
            }
          })
        }.toString(),
        ')()'
      ],
      {type: 'application/javascript'}));

  let worker = new Worker(blobURL);
  // We add an event listener for messages from the worker. When we receive a
  // message, we resolve the promise of this test to let the test finish.
  worker.addEventListener('message', e => resolve(e.data));
  const fileHandle =
      await rootDir.getFileHandle('OPFS-snippet.test', {create: true});
  worker.postMessage({'fileHandle' : fileHandle});
  // We wait of the promise to resolve, which will happen when the main thread
  // receives a message from the worker.
  let message = await promise;
  assert_equals(message.result, 'Test passed');
}

async function testReadEmptyFile(t, rootDir) {
  function test(handle) {
    const readBuffer = new Uint8Array(24);
    const readBytes = handle.read(readBuffer, {at: 0});
    if (!check(0 === readBytes, 'Check that no bytes were read.')) {
      return;
    }
  }
  return testContainer(t, rootDir, test);
}

async function testReadWrite(t, rootDir) {
  if (!('TextEncoder' in window)) {
    return;
  }

  function test(handle) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const text = 'Hello Storage Foundation';
    const writeBuffer = new TextEncoder().encode(text);
    const writtenBytes = handle.write(writeBuffer, {at: 0});
    if (!check(
            writeBuffer.byteLength === writtenBytes,
            'Check that all bytes were written.')) {
      return;
    }
    let readBuffer = new Uint8Array(writtenBytes);
    let readBytes = handle.read(readBuffer, {at: 0});
    if (!check(writtenBytes === readBytes, 'Check that all bytes were read')) {
      return;
    }
    if (!check(
            text === new TextDecoder().decode(readBuffer),
            'Check that the written bytes and the read bytes match')) {
      return;
    }

    // Test a read of less bytes than available.
    readBuffer = new Uint8Array(7);
    readBytes = handle.read(readBuffer, {at: 6});
    if (!check(readBuffer.length === readBytes, 'Check that all bytes were read')) {
      return;
    }
    const actual = new TextDecoder().decode(readBuffer);
    const expected = 'Storage';
    if (!check(
            expected === actual,
            `Expected ${expected}, but the actual value was ${actual}.`)) {
      return;
    }

  }
  return testContainer(t, rootDir, test);
}

async function testSecondBiggerWrite(t, rootDir) {
  if (!('TextEncoder' in window)) {
    return;
  }

  function test(handle) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    for (text of ['Hello', 'Longer Text']) {
      const writeBuffer = new TextEncoder().encode(text);
      const writtenBytes = handle.write(writeBuffer, {at: 0});
      if (!check(
              writeBuffer.byteLength === writtenBytes,
              'Check that all bytes were written.')) {
        return;
      }
      const readBuffer = new Uint8Array(writtenBytes);
      const readBytes = handle.read(readBuffer, {at: 0});
      if (!check(
              writtenBytes === readBytes, 'Check that all bytes were read')) {
        return;
      }
      if (!check(
              text === new TextDecoder().decode(readBuffer),
              'Check that the written bytes and the read bytes match')) {
        return;
      }
    }
  }
  return testContainer(t, rootDir, test);
}

async function testSecondSmallerWrite(t, rootDir) {
  if (!('TextEncoder' in window)) {
    return;
  }

  function test(handle) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    for (tuple
             of [{input: 'Hello World', expected: 'Hello World'},
                 {input: 'foobar', expected: 'foobarWorld'}]) {
      const text = tuple.input;
      const expected = tuple.expected;
      const writeBuffer = new TextEncoder().encode(text);
      const writtenBytes = handle.write(writeBuffer, {at: 0});
      if (!check(
              writeBuffer.byteLength === writtenBytes,
              'Check that all bytes were written.')) {
        return;
      }
      const readBuffer = new Uint8Array(expected.length);
      const readBytes = handle.read(readBuffer, {at: 0});
      if (!check(
              expected.length === readBytes, 'Check that all bytes were read')) {
        return;
      }
      if (!check(
              expected === new TextDecoder().decode(readBuffer),
              'Check that the written bytes and the read bytes match')) {
        return;
      }
    }
  }
  return testContainer(t, rootDir, test);
}

async function testInitialWriteWithOffset(t, rootDir) {
  function test(handle) {
    const expected = 17;
    const writeBuffer = new Uint8Array(1);
    writeBuffer[0] = expected;
    const offset = 5;
    const writtenBytes = handle.write(writeBuffer, {at: offset});
    if (!check(
            writeBuffer.byteLength === writtenBytes,
            'Check that all bytes were written.')) {
      return;
    }
    const fileLength = writeBuffer.byteLength + offset;
    const readBuffer = new Uint8Array(fileLength);
    const readBytes = handle.read(readBuffer, {at: 0});
    if (!check(
            fileLength === readBytes, 'Check that all bytes were read')) {
      return;
    }
    for (let i = 0; i < offset; ++i) {
      if (!check(
              readBuffer[i] === 0,
              `Gaps in the file should be filled with 0, but got ${
                  readBuffer[i]}.`)) {
        return;
      }
    }

      if (!check(
              readBuffer[offset] === expected,
              'Gaps in the file should be filled with 0.')) {
        return;
      }
  }
  return testContainer(t, rootDir, test);
}

async function testOverwriteWithOffset(t, rootDir) {
  if (!('TextEncoder' in window)) {
    return;
  }

  function test(handle) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    for (tuple of
             [{input: 'Hello World', expected: 'Hello World', offset: 0},
              {input: 'foobar', expected: 'Hello foobar', offset: 6}]) {
      const text = tuple.input;
      const expected = tuple.expected;
      const offset = tuple.offset;
      const writeBuffer = new TextEncoder().encode(text);
      const writtenBytes = handle.write(writeBuffer, {at: offset});
      if (!check(
              writeBuffer.byteLength === writtenBytes,
              'Check that all bytes were written.')) {
        return;
      }
      const readBuffer = new Uint8Array(expected.length);
      const readBytes = handle.read(readBuffer, {at: 0});
      if (!check(
              expected.length === readBytes, 'Check that all bytes were read')) {
        return;
      }
      const actual = new TextDecoder().decode(readBuffer);
      if (!check(
              expected === actual,
              `Expected to read ${expected} but the actual value was ${
                  actual}.`)) {
        return;
      }
    }
  }
  return testContainer(t, rootDir, test);
}

async function testReadWithOffset(t, rootDir) {
  if (!('TextEncoder' in window)) {
    return;
  }

  function test(handle) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const text = 'Hello Storage Foundation';
    const writeBuffer = new TextEncoder().encode(text);
    const writtenBytes = handle.write(writeBuffer, {at: 0});
    if (!check(
            writeBuffer.byteLength === writtenBytes,
            'Check that all bytes were written.')) {
      return;
    }
    const bufferLength = text.length;
    for (tuple
             of [{offset: 0, expected: text},
                 {offset: 6, expected: text.substring(6)}]) {
      const offset = tuple.offset;
      const expected = tuple.expected;

      const readBuffer = new Uint8Array(bufferLength);
      const readBytes = handle.read(readBuffer, {at: offset});
      if (!check(
               expected.length === readBytes, 'Check that all bytes were read')) {
        return;
      }
      const actual = new TextDecoder().decode(readBuffer);
      if (!check(
              actual.startsWith(expected),
              `Expected to read ${expected} but the actual value was ${
                  actual}.`)) {
        return;
      }
    }

    const readBuffer = new Uint8Array(bufferLength);
    // Offset is greater than the file length.
    const readBytes = handle.read(readBuffer, {at: bufferLength + 1});
    if (!check(0 === readBytes, 'Check that no bytes were read')) {
      return;
    }
    for (let i = 0; i < readBuffer.byteLength; ++i) {
      if (!check(
              0 === readBuffer[i],
              'Check that the read buffer is unchanged.')) {
        return;
      }
    }
  }
  return testContainer(t, rootDir, test);
}

directory_test(testReadEmptyFile, 'Test reading an empty file through a sync access handle.');
directory_test(testReadWrite, 'Test writing and reading through a sync access handle.');
directory_test(testSecondBiggerWrite, 'Test second write that is bigger than the first write');
directory_test(testSecondSmallerWrite, 'Test second write that is smaller than the first write');
directory_test(testInitialWriteWithOffset, 'Test initial write with an offset');
directory_test(testOverwriteWithOffset, 'Test overwriting the file at an offset');
directory_test(testReadWithOffset, 'Test read at an offset');
