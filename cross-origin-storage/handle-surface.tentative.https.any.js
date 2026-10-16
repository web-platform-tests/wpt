// META: global=window,dedicatedworker
// META: script=resources/helpers.js
//
// A COS entry is reached through an ordinary FileSystemFileHandle [FS], so a
// COS handle carries the whole FileSystemHandle surface whether or not that
// surface means anything for an entry with no name, no containing directory,
// and no identity apart from its hash:
// https://wicg.github.io/cross-origin-storage/#cos-file-system
//
// Some assertions follow from [FS] directly: name from the locator's path,
// and createSyncAccessHandle()'s "InvalidStateError" from the
// bucket-file-system check. The rest are settled by COS itself. move() and
// remove() are unspecified upstream (WICG/file-system-access#214), so COS
// follows removeEntry(), the operation [FS] does define for deleting an entry.

'use strict';

// A written, readable handle for freshly-stored unique bytes.
async function storedHandle(label) {
  const content = cosUniqueContent(label);
  const {hash} = await cosStore(content);
  const handle = await navigator.crossOriginStorage.getFileHandle(hash);
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
  // holding the entry's hash, so name is the hash, with no separate
  // decision needed. https://wicg.github.io/cross-origin-storage/#cos-file-system
  assert_equals(typeof handle.name, 'string',
    'name is a USVString and must be a string even for a nameless entry');
  assert_equals(handle.name, hash.value,
    'a COS handle reports the entry hash as its name');
}, 'name is the entry hash, not empty and never undefined');

promise_test(async t => {
  // Now specified: content-addressability means at most one entry per hash, so
  // two handles for one hash necessarily address the same entry, and
  // isSameEntry() must answer. The structural operations below have
  // nothing to act on and refuse.
  // https://wicg.github.io/cross-origin-storage/#cos-file-system
  const {hash} = await storedHandle('same-entry');
  const a = await navigator.crossOriginStorage.getFileHandle(hash);
  const b = await navigator.crossOriginStorage.getFileHandle(hash);
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
  // follows removeEntry(), the operation [FS] does define for deleting an
  // entry: it rejects with the access result's error name when readwrite
  // access is not granted.
  const {handle, hash, content} = await storedHandle('move');
  await promise_rejects_dom(t, 'NotAllowedError', handle.move('renamed'));

  // The rejection must leave the entry where it was, still under its hash.
  const after = await navigator.crossOriginStorage.getFileHandle(hash);
  assert_equals(after.name, hash.value);
  assert_equals(await (await after.getFile()).text(), content,
    'the entry must still be readable after a refused move()');
}, 'move() rejects and leaves the entry intact');

promise_test(async t => {
  // Now specified as "NotAllowedError", the alternative this test used to name.
  // An entry can have several storing origins, so honoring remove() would let
  // one site destroy data other sites depend on: the operation is meaningful,
  // present, and denied. remove() is unspecified upstream
  // (WICG/file-system-access#214), so the name follows removeEntry().
  const {handle, hash, content} = await storedHandle('remove');
  await promise_rejects_dom(t, 'NotAllowedError', handle.remove());

  // Prove the entry actually survived. A rejected promise and a deleted file
  // are two separate facts.
  const after = await navigator.crossOriginStorage.getFileHandle(hash);
  assert_equals(await (await after.getFile()).text(), content,
    'the entry must still be readable after a refused remove()');
}, 'remove() rejects and leaves the entry intact');

promise_test(async t => {
  // The locator path of every COS handle holds a single item, the hash value,
  // including a create handle for a hash that has no entry yet.
  const hash = cosMissingHash();
  const handle = await navigator.crossOriginStorage.getFileHandle(hash, {create: true});
  assert_equals(handle.kind, 'file');
  assert_equals(handle.name, hash.value);
}, 'a create handle reports the requested hash as its name');

promise_test(async t => {
  // isSameEntry() compares COS hashes, and a create handle and a read handle
  // for one hash address the same entry.
  const {hash} = await storedHandle('same-entry-create-and-read');
  const created = await navigator.crossOriginStorage.getFileHandle(hash, {create: true});
  const read = await navigator.crossOriginStorage.getFileHandle(hash);
  assert_true(await created.isSameEntry(read));
  assert_true(await read.isSameEntry(created));
}, 'isSameEntry() is true for a create handle and a read handle addressing the same hash');

promise_test(async t => {
  // A COS handle compared with a handle from another file system cannot make
  // the comparison, so it rejects. The origin private file system is one such
  // file system.
  const {handle} = await storedHandle('same-entry-other-file-system');
  const root = await navigator.storage.getDirectory();
  const name = `cos-is-same-entry-${Date.now()}-${Math.random()}`;
  const opfsHandle = await root.getFileHandle(name, {create: true});
  t.add_cleanup(() => root.removeEntry(name).catch(() => {}));

  await promise_rejects_dom(t, 'NotAllowedError', handle.isSameEntry(opfsHandle));

  // The reverse direction keeps [FS] behavior: an OPFS handle compared with a
  // handle from another root addresses a different entry.
  assert_false(await opfsHandle.isSameEntry(handle));
}, 'isSameEntry() on a COS handle rejects with NotAllowedError for a handle from the origin private file system');
