// META: title=NativeIO API: Assigned length is observed back.
// META: global=window,worker

'use strict';

promise_test(async testCase => {
  const file = await nativeIO.open('test_file');
  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete('test_file');
  });

  const writeSharedArrayBuffer = new SharedArrayBuffer(10);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([97, 98, 99, 100, 101, 102, 103, 104, 105, 106]);
  await file.write(writtenBytes, 0);

  await file.setLength(5);

  const lengthDecreased = await file.getLength();
  assert_equals(
      lengthDecreased, 5,
      'NativeIOFile.getLength() should resolve with the number of bytes' +
        ' in the file after decreasing its length');

  const remainingBytes = Uint8Array.from([97, 98, 99, 100, 101]);
  const readSharedArrayBuffer = new SharedArrayBuffer(remainingBytes.length);
  const readBytes = new Uint8Array(readSharedArrayBuffer);
  await file.read(readBytes, 0);

  assert_array_equals(
      readBytes, remainingBytes,
      'NativeIOFile.setLength() should remove bytes from the end of ' +
        'a file when decreasing its length');
}, 'NativeIOFile.setLength shrinks a file, NativeIOFile.getLength reports new length');

promise_test(async testCase => {
  const file = await nativeIO.open('test_file');
  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete('test_file');
  });

  const writeSharedArrayBuffer = new SharedArrayBuffer(3);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([97, 98, 99]);
  await file.write(writtenBytes, 0);

  await file.setLength(5);

  const lengthIncreased = await file.getLength();
  assert_equals(
      lengthIncreased, 5,
      'NativeIOFile.getLength() should resolve with the number of bytes' +
        ' in the file after increasing the length');

  const expectedBytes = Uint8Array.from([97, 98, 99, 0, 0]);
  const readSharedArrayBuffer = new SharedArrayBuffer(expectedBytes.length);
  const readBytes = new Uint8Array(readSharedArrayBuffer);
  await file.read(readBytes, 0);

  assert_array_equals(
      readBytes, expectedBytes,
      'NativeIOFile.setLength() should append zeros when increasing' +
        ' the file size');
}, 'NativeIOFile.setLength appends zeros to a file, NativeIOFile.getLength reports new length');
