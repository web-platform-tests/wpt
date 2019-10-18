// META: global=worker
// META: script=pako/pako_inflate.min.js
// META: timeout=long

'use strict';

// This test asserts that compressing multiple chunks should work.

// ('Hello', 3) => TextEncoder().encode('HelloHelloHello')
function makeExpectedChunk(input, numberOfChunk) {
  let expectedChunk = '';
  for (let i = 0; i < numberOfChunk; ++i) {
    expectedChunk += input;
  }
  return new TextEncoder().encode(expectedChunk);
}

// ex) ('Hello', 3, 'deflate') => compress ['Hello', 'Hello', Hello']
async function compressMultipleChunks(input, numberOfChunk, format) {
  const cs = new CompressionStream(format);
  const writer = cs.writable.getWriter();
  const chunk = new TextEncoder().encode(input);
  for (let i = 0; i < numberOfChunk; ++i) {
    writer.write(chunk);
  }
  const closePromise = writer.close();
  const out = [];
  const reader = cs.readable.getReader();
  let totalSize = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done)
      break;
    out.push(value);
    totalSize += value.byteLength;
  }
  await closePromise;
  const concatenated = new Uint8Array(totalSize);
  let offset = 0;
  for (const array of out) {
    concatenated.set(array, offset);
    offset += array.byteLength;
  }
  return concatenated;
}

const hello = 'Hello';

for (let numberOfChunk = 2; numberOfChunk <= 16; ++numberOfChunk) {
  promise_test(async t => {
    const compressedData = await compressMultipleChunks(hello, numberOfChunk, 'deflate');
    const expectedValue = makeExpectedChunk(hello, numberOfChunk);
    // decompress with pako, and check that we got the same result as our original string
    assert_array_equals(expectedValue, pako.inflate(compressedData), 'value should match');
  }, `compressing ${numberOfChunk} chunks with deflate should work`);

  promise_test(async t => {
    const compressedData = await compressMultipleChunks(hello, numberOfChunk, 'gzip');
    const expectedValue = makeExpectedChunk(hello, numberOfChunk);
    // decompress with pako, and check that we got the same result as our original string
    assert_array_equals(expectedValue, pako.inflate(compressedData), 'value should match');
  }, `compressing ${numberOfChunk} chunks with gzip should work`);
}
