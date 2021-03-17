// META: title=Synchronous NativeIO API: Temporary files are deleted on closure
// META: global=dedicatedworker
// META: script=resources/support.js

'use strict';

test(testCase => {
  reserveAndCleanupCapacitySync(testCase);

  const temporaryFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: true});


  assert_throws_dom(
    'NoModificationAllowedError',
     () => storageFoundation.openSync('test_file', {deleteAfterClose: false}),
        'storageFoundation.open fails to open a persistent file, when there ' +
          'already is an open temporary file');
  temporaryFile.close();

  const persistentFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: false});
  testCase.add_cleanup(() => {
    persistentFile.close();
    storageFoundation.deleteSync('test_file');
  });

  assert_throws_dom(
    'NoModificationAllowedError',
     () => storageFoundation.openSync('test_file', {deleteAfterClose: true}),
        'storageFoundation.open fails to open a temporary file, when there ' +
          'already is an open persistent file');

}, 'Storage Foundation files can only have one open file handle, no matter ' +
     'if it is a temporary or persistent file');

test(testCase => {
  reserveAndCleanupCapacitySync(testCase);

  const temporaryFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: true});

  temporaryFile.setLength(4);
  temporaryFile.close();

  // TODO(fivedots): use getAll() to check if the file was deleted, once it
  // supports temporary files.
  const emptyFile = createFileSync(testCase, 'test_file', []);

  const length = emptyFile.getLength();
  assert_equals(length, 0, 'NativeIOFileSync.getLength() should return 0 bytes')
}, 'Storage Foundation file created with deleteAfterClose option is deleted ' +
     'on closure');

test(testCase => {
  reserveAndCleanupCapacitySync(testCase);

  const persistentFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: false});

  const setLength = 4;
  persistentFile.setLength(setLength);
  persistentFile.close();

  const temporaryFile =
      storageFoundation.openSync('test_file', {deleteAfterClose: true});

  var gottenLength = temporaryFile.getLength();
  assert_equals(gottenLength, setLength,
                'The gotten length should match the set length');
  temporaryFile.close();

  // TODO(fivedots): use getAll() to check if the file was deleted, once it
  // supports temporary files.
  const emptyFile = createFileSync(testCase, 'test_file', []);

  gottenLength = emptyFile.getLength();
  assert_equals(gottenLength, 0, 'NativeIOFileSync.getLength() should return' +
                                   '0 bytes read');
}, 'An existing Storage Foundation file opened with deleteAfterClose option ' +
     'is deleted on closure');
