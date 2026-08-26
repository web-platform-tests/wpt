// META: global=window,dedicatedworker
// META: script=resources/helpers.js
//
// A COS entry is reached through an ordinary FileSystemFileHandle [FS], so a
// COS handle carries the whole FileSystemHandle surface whether or not that
// surface means anything for an entry with no name, no containing directory,
// and no identity apart from its hash:
// https://wicg.github.io/cross-origin-storage/#cos-file-system
//
// The specification currently defines only getFile(), the permission-model
// bypass, and transferring handles. It says nothing about kind, name,
// isSameEntry(), move(), remove(), or createSyncAccessHandle() on a handle
// addressing a COS entry.
//
// Assertions below that the specification does not decide are marked
// "SPEC GAP". They record what an implementation has to do *something* about,
// with the reasoning for the choice made here, and should be revisited when
// the specification covers them -- a test suite is a bad place to settle an
// open design question by default, so each one names the alternative it was
// chosen over.

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
  // SPEC GAP: the specification does not say what a COS handle's name is.
  //
  // What is *not* open: `name` is declared USVString, so it is always a string
  // and can never be undefined. That leaves the empty string or the hash. The
  // hash is the only identity an entry has -- it has no name and no containing
  // directory -- so reporting it carries information an empty string discards,
  // and both implementations written so far arrive at it independently. The
  // empty string is the defensible alternative, on the grounds that a nameless
  // entry should say so rather than substitute a different concept.
  assert_equals(typeof handle.name, 'string',
    'name is a USVString and must be a string even for a nameless entry');
  assert_equals(handle.name, hash.value,
    'a COS handle reports the entry hash as its name');
}, 'name is the entry hash, not empty and never undefined');

promise_test(async t => {
  // Not a spec gap so much as a consequence: content-addressability means at
  // most one entry per hash, so two handles for one hash necessarily address
  // the same entry. isSameEntry() exists to answer exactly that question and
  // it is answerable here, unlike the structural operations below. An
  // implementation that refuses it is discarding information it holds.
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
  // SPEC GAP: the specification does not define move() on a COS handle, and
  // this test picks "NotSupportedError".
  //
  // A COS entry has no name and no containing directory, so there is nothing
  // for a rename or a reparent to act on -- which is what makes
  // NotSupportedError read more accurately than NotAllowedError here: the
  // operation is absent rather than refused. The load-bearing assertion is
  // that it does not silently succeed; the error name is the guess.
  const {handle} = await storedHandle('move');
  await promise_rejects_dom(t, 'NotSupportedError', handle.move('renamed'));
}, 'move() rejects: a COS entry has no name to change');

promise_test(async t => {
  // SPEC GAP: the specification does not define remove() on a COS handle, and
  // this test picks "NotSupportedError".
  //
  // This is the case where the alternative is strongest. An entry can have
  // several storing origins, so honouring remove() would let one site destroy
  // data other sites depend on -- a refusal on those grounds is arguably
  // NotAllowedError, since the operation is meaningful and denied rather than
  // absent. Deletion belongs to eviction and to the user's own storage
  // controls. Whichever name the specification settles on, the two assertions
  // that follow must hold.
  const {handle, hash, content} = await storedHandle('remove');
  await promise_rejects_dom(t, 'NotSupportedError', handle.remove());

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
  // SPEC GAP, narrowly: what queryPermission({mode: "readwrite"}) should say
  // on a handle obtained without create is undecided. "granted" would claim a
  // capability the handle does not have; "denied" would suggest the handle is
  // unusable when it reads perfectly well. This test only asserts the "read"
  // mode, which is unambiguous, rather than pinning the open case.
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
}, 'queryPermission()/requestPermission() report a PermissionState, already granted');
