// META: title=NativeIO API: Temporary files are deleted on closure
// META: global=window,worker
// META: script=resources/support.js

'use strict';

promise_test(async testCase => {
  await reserveAndCleanupCapacity(testCase);

  const temporaryFile =
      await storageFoundation.open('test_file', {deleteAfterClose: true});

  await promise_rejects_dom(
      testCase, 'NoModificationAllowedError', storageFoundation.open(
        'test_file', {deleteAfterClose: false}),
        'storageFoundation.open fails to open a persistent file, when there ' +
          'already is an open temporary file');
  await temporaryFile.close();

  const persistentFile =
      await storageFoundation.open('test_file', {deleteAfterClose: false});
  testCase.add_cleanup(async () => {
    await persistentFile.close();
    await storageFoundation.delete('test_file');
  });

  await promise_rejects_dom(
      testCase, 'NoModificationAllowedError', storageFoundation.open(
        'test_file', {deleteAfterClose: true}),
        'storageFoundation.open fails to open a temporary file, when there ' +
          'already is an open persistent file');
}, 'Storage Foundation files can only have one open file handle, no matter ' +
     'if it is a temporary or persistent file');

promise_test(async testCase => {
  await reserveAndCleanupCapacity(testCase);

  const temporaryFile =
      await storageFoundation.open('test_file', {deleteAfterClose: true});

  await temporaryFile.setLength(4);
  await temporaryFile.close();

  // TODO(fivedots): use getAll() to check if the file was deleted, once it
  // supports temporary files.
  const emptyFile = await createFile(testCase, 'test_file', []);

  const length = await emptyFile.getLength();
  assert_equals(length, 0, 'NativeIOFile.getLength() should return 0 bytes')
}, 'Storage Foundation file created with deleteAfterClose flag is deleted on ' +
     'closure');

promise_test(async testCase => {
  await reserveAndCleanupCapacity(testCase);

  const persistentFile =
      await storageFoundation.open('test_file', {deleteAfterClose: false});

  const setLength = 4;
  await persistentFile.setLength(setLength);
  await persistentFile.close();

  const temporaryFile =
      await storageFoundation.open('test_file', {deleteAfterClose: true});

  var gottenLength = await temporaryFile.getLength();
  assert_equals(gottenLength, setLength,
                'The gotten length should match the set length');
  await temporaryFile.close();

  // TODO(fivedots): use getAll() to check if the file was deleted, once it
  // supports temporary files.
  const emptyFile = await createFile(testCase, 'test_file', []);

  gottenLength = await emptyFile.getLength();
  assert_equals(gottenLength, 0, 'NativeIOFile.getLength() should return 0 ' +
                                   'bytes read');
}, 'An existing Storage Foundation file opened with deleteAfterClose flag is ' +
     'deleted on closure');
