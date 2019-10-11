// META: global=worker
// META: script=pako/pako_inflate.min.js

'use strict';

async function compressArrayBuffer(input, format, level) {
  const cs = new CompressionStream(format, {level});
  const writer = cs.writable.getWriter();
  writer.write(input);
  writer.close();
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
  const concatenated = new Uint8Array(totalSize);
  let offset = 0;
  for (const array of out) {
    concatenated.set(array, offset);
    offset += array.byteLength;
  }
  return concatenated;
}

for (let compressionLevel = -1; compressionLevel <= 9 ; ++compressionLevel) {
  promise_test(async t => {
    const response = await fetch('/media/test.mp4')
    const buffer = await response.arrayBuffer();
    const bufferView = new Uint8Array(buffer);
    const compressedData = await compressArrayBuffer(bufferView, 'deflate', compressionLevel);
    const decompressedData = pako.inflate(compressedData);
    assert_array_equals(bufferView, decompressedData, 'value should match');
  }, `compressing with level ${compressionLevel} should work in deflate`);

  promise_test(async t => {
    const response = await fetch('/media/test.mp4')
    const buffer = await response.arrayBuffer();
    const bufferView = new Uint8Array(buffer);
    const compressedData = await compressArrayBuffer(bufferView, 'gzip', compressionLevel);
    const decompressedData = pako.inflate(compressedData);
    assert_array_equals(bufferView, decompressedData, 'value should match');
  }, `compressing with level ${compressionLevel} should work in gzip`);
}
