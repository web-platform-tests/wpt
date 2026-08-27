// META: global=window,dedicatedworker
// META: script=resources/helpers.js
//
// A COS entry is reached through an ordinary FileSystemFileHandle [FS], so a
// COS handle carries the whole FileSystemHandle surface whether or not that
// surface means anything for an entry with no name, no containing directory,
// and no identity apart from its hash:
// https://wicg.github.io/cross-origin-storage/#cos-file-system
//
// Every assertion here is now decided rather than guessed. Some follow from
// [FS] directly -- name from the locator's path, createSyncAccessHandle()'s
// "InvalidStateError" from the bucket-file-system check -- and the rest are
// settled by COS itself. move() and remove() are unspecified upstream
// (WICG/file-system-access#214), so COS follows removeEntry(), the operation
// [FS] does define for deleting an entry.
//
// This file previously carried "SPEC GAP" notes where it had to choose. They
// are gone: each choice was either ratified or, in createSyncAccessHandle()'s
// case, corrected once the standard turned out to have decided it already.

'use strict';

// A written, readable handle for freshly-stored unique bytes.
async function storedHandle(label) {
  const content = cosUniqueContent(label);
  const {hash} = await cosStore(content);
  const handle = await navigator.crossOriginStorage.requestFileHandle(hash);
  return {handle, hash, content};
}

promise_test(async t => {
  const {handle} = await storedHandle('kind');
  assert_equals(handle.kind, 'file',
    'a COS entry is a file entry, never a directory');
}, 'kind is "file"');

promise_test(async t => {
  const {handle, hash} = await storedHandle('name');
  // Now specified. [FS] defines name as the last path component of the handle's
  // locator's path, and COS defines a COS entry's locator path as a single item
  // holding the entry's hash, so name is the hash rather than a separate
  // decision. https://wicg.github.io/cross-origin-storage/#cos-file-system
  assert_equals(typeof handle.name, 'string',
    'name is a USVString and must be a string even for a nameless entry');
  assert_equals(handle.name, hash.value,
    'a COS handle reports the entry hash as its name');
}, 'name is the entry hash, not empty and never undefined');

promise_test(async t => {
  // Now specified: content-addressability means at most one entry per hash, so
  // two handles for one hash necessarily address the same entry, and
  // isSameEntry() must answer rather than refuse -- unlike the structural
  // operations below, which have nothing to act on.
  // https://wicg.github.io/cross-origin-storage/#cos-file-system
  const {hash} = await storedHandle('same-entry');
  const a = await navigator.crossOriginStorage.requestFileHandle(hash);
  const b = await navigator.crossOriginStorage.requestFileHandle(hash);
  assert_true(await a.isSameEntry(b),
    'two handles for one hash address the same entry');
  assert_true(await a.isSameEntry(a), 'a handle is the same entry as itself');
}, 'isSameEntry() is true for two handles addressing the same hash');

promise_test(async t => {
  const {handle: a} = await storedHandle('same-entry-negative-a');
  const {handle: b} = await storedHandle('same-entry-negative-b');
  assert_false(await a.isSameEntry(b),
    'different hashes are different entries');
}, 'isSameEntry() is false for handles addressing different hashes');

promise_test(async t => {
  // Now specified as "NotAllowedError". move() is unspecified upstream, so COS
  // follows removeEntry(), the operation [FS] does define for changing what a
  // directory holds: it rejects with the access result's error name when
  // readwrite access is not granted.
  const {handle} = await storedHandle('move');
  await promise_rejects_dom(t, 'NotAllowedError', handle.move('renamed'));
}, 'move() rejects: a COS entry has no name to change');

promise_test(async t => {
  // Now specified as "NotAllowedError", the alternative this test used to name.
  // An entry can have several storing origins, so honouring remove() would let
  // one site destroy data other sites depend on: the operation is meaningful
  // and denied rather than absent. remove() is unspecified upstream
  // (WICG/file-system-access#214), so the name follows removeEntry().
  const {handle, hash, content} = await storedHandle('remove');
  await promise_rejects_dom(t, 'NotAllowedError', handle.remove());

  // Load-bearing: prove the entry actually survived, rather than trusting the
  // rejection. A rejected promise and a deleted file are not the same thing.
  const after = await navigator.crossOriginStorage.requestFileHandle(hash);
  assert_equals(await (await after.getFile()).text(), content,
    'the entry must still be readable after a refused remove()');
}, 'remove() rejects and leaves the entry intact');

promise_test(async t => {
  // Derived rather than guessed: the specification states that the COS file
  // system does not use the File System Standard's per-call permission model,
  // and that a handle is fully authorized before it is returned to script, so
  // neither call can prompt.
  //
  // Worth stating because it is easy to get backwards: `mode` is the *input*
  // descriptor, and the resolved value is a PermissionState --
  // "granted"/"denied"/"prompt" -- not the mode that was asked about.
  //
  // Now specified: a write mode on a handle obtained without create reports
  // "denied", because only a create request yields a writable handle and
  // reporting "granted" would claim a capability createWritable() will refuse.
  // Read stays "granted" -- a caller holding the handle can read through it.
  const {handle} = await storedHandle('permissions');
  const read = await handle.queryPermission({mode: 'read'});
  assert_in_array(read, ['granted', 'denied', 'prompt'],
    'queryPermission() resolves with a PermissionState');
  assert_equals(read, 'granted',
    'a handle script is already holding must not report an unusable read');

  const requested = await handle.requestPermission({mode: 'read'});
  assert_in_array(requested, ['granted', 'denied', 'prompt']);
  assert_equals(requested, 'granted',
    'requesting permission on a pre-authorized handle must not prompt');

  // The handle came from a plain read request, so it can never be written
  // through. Never "prompt": there is no prompt COS can show.
  assert_equals(await handle.queryPermission({mode: 'readwrite'}), 'denied',
    'a handle obtained without create reports no write capability');
  assert_equals(await handle.requestPermission({mode: 'readwrite'}), 'denied',
    'requesting a write mode cannot grant what create was never asked for');
}, 'queryPermission()/requestPermission() report a PermissionState, already granted');
