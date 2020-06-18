// META: title=Synchronous NativeIO API: Getting and setting lengths.
// META: global=dedicatedworker

'use strict';

test(testCase => {
  const file = nativeIO.openSync('test_file');
  testCase.add_cleanup(() => {
    file.close();
    nativeIO.deleteSync('test_file');
  });

  const writtenBytes =
        Uint8Array.from([97, 98, 99, 100, 101, 102, 103, 104, 105, 106]);
  file.write(writtenBytes, 0);
  const remainingBytes = Uint8Array.from([97, 98, 99, 100, 101]);
  const readBytes = new Uint8Array(remainingBytes.length);

  file.setLength(5);
  const lengthDecreased = file.getLength();
  assert_equals(
      lengthDecreased, 5,
      'NativeIOFileSync.getLength() should resolve with the number of bytes' +
        ' in the file after decreasing its length');
  file.read(readBytes, 0);

  assert_array_equals(
      readBytes, remainingBytes,
      'NativeIOFileSync.setLength() should remove bytes from the end of ' +
        'a file when decreasing its length');
}, 'NativeIOFileSync.setLength shrinks a file and' +
     ' NativeIOFileSync.getLength reports its new length');

test(testCase => {
  const file = nativeIO.openSync('test_file');
  testCase.add_cleanup(() => {
    file.close();
    nativeIO.deleteSync('test_file');
  });

  const writtenBytes = Uint8Array.from([97, 98, 99]);
  file.write(writtenBytes, 0);
  const expectedBytes = Uint8Array.from([97, 98, 99, 0, 0]);
  const readBytes = new Uint8Array(expectedBytes.length);

  file.setLength(5);
  const lengthIncreased = file.getLength();
  assert_equals(
      lengthIncreased, 5,
      'NativeIOFileSync.getLength() should resolve with the number of bytes' +
        ' in the file after increasing the length');
  file.read(readBytes, 0);

  assert_array_equals(
      readBytes, expectedBytes,
      'NativeIOFileSync.setLength() should append zeros when increasing' +
        ' the file size');
}, 'NativeIOFileSync.setLength appends zeros to a file and ' +
     'NativeIOFileSync.getLength reports new length');
