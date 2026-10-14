// META: global=window,dedicatedworker
// META: script=resources/helpers.js
//
// queryPermission() and requestPermission() on a COS handle. Both methods are
// defined by the File System Access specification, so this file is optional:
// an engine without that API has nothing to test here.
// https://wicg.github.io/cross-origin-storage/#cos-file-system

'use strict';

// A written, readable handle for freshly-stored unique bytes.
async function storedHandle(label) {
  const content = cosUniqueContent(label);
  const {hash} = await cosStore(content);
  const handle = await navigator.crossOriginStorage.getFileHandle(hash);
  return {handle, hash, content};
}

// queryPermission() and requestPermission() are defined by the File System
// Access specification (https://wicg.github.io/file-system-access/), so each
// gets its own test and an engine without one of them fails only that test.
// COS fixes their answers: the COS file system never prompts, so
// neither reports "prompt"; a write mode on a handle obtained without create
// reports "denied", because only a create request yields a writable handle;
// every other combination reports "granted".
// https://wicg.github.io/cross-origin-storage/#cos-file-system
//
// `mode` is the *input* descriptor, and the resolved value is a
// PermissionState ("granted", "denied", or "prompt").

promise_test(async t => {
  const {handle} = await storedHandle('query-permission-read-handle');
  assert_equals(await handle.queryPermission({mode: 'read'}), 'granted',
    'a handle script is already holding must not report an unusable read');
  assert_equals(await handle.queryPermission({mode: 'readwrite'}), 'denied',
    'a handle obtained without create reports no write capability');
}, 'queryPermission() on a read handle reports "granted" for read and "denied" for readwrite');

promise_test(async t => {
  const {handle} = await storedHandle('request-permission-read-handle');
  assert_equals(await handle.requestPermission({mode: 'read'}), 'granted',
    'requesting permission on a pre-authorized handle must not prompt');
  assert_equals(await handle.requestPermission({mode: 'readwrite'}), 'denied',
    'requesting a write mode cannot grant what create was never asked for');
}, 'requestPermission() on a read handle reports "granted" for read and "denied" for readwrite');

promise_test(async t => {
  // A create handle reports "granted" for both modes, including before it has
  // been written through, when getFile() through it still rejects.
  const handle = await navigator.crossOriginStorage.getFileHandle(
    cosMissingHash(), {create: true});
  assert_equals(await handle.queryPermission({mode: 'read'}), 'granted');
  assert_equals(await handle.queryPermission({mode: 'readwrite'}), 'granted');
}, 'queryPermission() on a create handle reports "granted" for read and readwrite');

promise_test(async t => {
  const handle = await navigator.crossOriginStorage.getFileHandle(
    cosMissingHash(), {create: true});
  assert_equals(await handle.requestPermission({mode: 'read'}), 'granted');
  assert_equals(await handle.requestPermission({mode: 'readwrite'}), 'granted');
}, 'requestPermission() on a create handle reports "granted" for read and readwrite');
