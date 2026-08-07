// META: global=window,worker
// META: script=resources/helpers.js
//
// Tests the core create/write/read lifecycle:
// https://wicg.github.io/cross-origin-storage/#reading-files
// https://wicg.github.io/cross-origin-storage/#creating-and-writing-files

'use strict';

promise_test(async t => {
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.requestFileHandle(cosMissingHash()));
}, 'requestFileHandle() without create rejects with NotFoundError for a hash that was never stored');

promise_test(async t => {
  const content = cosUniqueContent('roundtrip');
  const {hash} = await cosStore(content);
  const text = await cosReadText(hash);
  assert_equals(text, content, 'read-back content must match exactly what was written');
}, 'requestFileHandle({create:true}) write, then requestFileHandle() read, roundtrips exact content');

promise_test(async t => {
  // create defaults to false: a bare options object without create must
  // behave like a read, not a create.
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.requestFileHandle(cosMissingHash(), {}));
}, 'options.create defaults to false');

promise_test(async t => {
  const value = await cosSha256Hex(cosUniqueContent('get-file-before-write'));
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    cosHash(value), {create: true});
  await promise_rejects_dom(t, 'NotAllowedError', handle.getFile());
}, 'getFile() on a freshly-created, not-yet-written handle rejects with NotAllowedError');

promise_test(async t => {
  // A concurrent requestFileHandle() read for the same hash, while a create
  // request's entry is still "pending" (created but not yet written
  // through), must reject with NotAllowedError rather than NotFoundError:
  // https://wicg.github.io/cross-origin-storage/#reading-files
  const content = cosUniqueContent('pending-read');
  const hash = cosHash(await cosSha256Hex(content));
  const createHandle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  await promise_rejects_dom(t, 'NotAllowedError',
    navigator.crossOriginStorage.requestFileHandle(hash));

  // Finish the write so the entry is left in a clean, written state.
  const writable = await createHandle.createWritable();
  await writable.write(new Blob([content]));
  await writable.close();
  assert_equals(await cosReadText(hash), content);
}, 'a concurrent read for a hash with a pending write rejects with NotAllowedError, not NotFoundError');

promise_test(async t => {
  const content = cosUniqueContent('hash-mismatch');
  const value = await cosSha256Hex(content);
  const hash = cosHash(value);
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable = await handle.createWritable();
  await writable.write(new Blob(['these are not the bytes that hash to the requested value']));
  await promise_rejects_dom(t, 'DataError', writable.close());
}, 'closing a writable whose written bytes do not hash to the requested value rejects with DataError');

promise_test(async t => {
  // "Verify and store" cleans up after a hash-mismatched write: since no
  // other writer is outstanding for this hash, the entry is removed
  // entirely rather than left "pending" forever.
  // https://wicg.github.io/cross-origin-storage/#verify-and-store
  // A subsequent plain read for that hash must therefore reject with an
  // ordinary NotFoundError, exactly as if the failed write had never
  // happened.
  const content = cosUniqueContent('hash-mismatch-cleaned-up');
  const value = await cosSha256Hex(content);
  const hash = cosHash(value);
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable = await handle.createWritable();
  await writable.write(new Blob(['wrong bytes entirely']));
  await promise_rejects_dom(t, 'DataError', writable.close());
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.requestFileHandle(hash));
}, 'a hash-mismatched write with no other writer in flight leaves no entry behind: a subsequent plain read rejects with NotFoundError');

promise_test(async t => {
  // Because the failed write's entry was cleaned up, a later create request
  // for the same hash starts fresh (rather than "recovering" a stuck
  // entry) and, supplying the correct bytes this time, succeeds normally.
  const content = cosUniqueContent('hash-mismatch-then-recovered');
  const value = await cosSha256Hex(content);
  const hash = cosHash(value);

  const badHandle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const badWritable = await badHandle.createWritable();
  await badWritable.write(new Blob(['wrong bytes entirely']));
  await promise_rejects_dom(t, 'DataError', badWritable.close());

  const goodHandle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const goodWritable = await goodHandle.createWritable();
  await goodWritable.write(new Blob([content]));
  await goodWritable.close();

  assert_equals(await cosReadText(hash), content);
}, 'a hash left absent by a failed write is freely reusable by a later create request supplying the correct bytes');

promise_test(async t => {
  // The cleanup above must not disturb a concurrent, still-outstanding
  // writer for the same hash: if two writers race and one supplies wrong
  // bytes while the other supplies correct bytes, the failure must not
  // prevent the success from being stored and readable afterward, however
  // the two closes happen to interleave.
  const content = cosUniqueContent('concurrent-fail-and-succeed');
  const value = await cosSha256Hex(content);
  const hash = cosHash(value);

  const handleA = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const handleB = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writableA = await handleA.createWritable();
  const writableB = await handleB.createWritable();
  await writableA.write(new Blob(['wrong bytes entirely']));
  await writableB.write(new Blob([content]));

  const [resultA, resultB] = await Promise.allSettled([
    writableA.close(),
    writableB.close(),
  ]);
  assert_equals(resultA.status, 'rejected', 'A (wrong bytes) must fail');
  assert_equals(resultA.reason.name, 'DataError');
  assert_equals(resultB.status, 'fulfilled', 'B (correct bytes) must still succeed despite A\'s concurrent failure');

  assert_equals(await cosReadText(hash), content);
}, 'a failed write does not disrupt a concurrent, still-outstanding write for the same hash that succeeds');

promise_test(async t => {
  // Content-addressability: writing the exact same bytes under the same
  // hash a second time must succeed (not error as "already exists").
  const content = cosUniqueContent('idempotent-rewrite');
  const {hash} = await cosStore(content);
  const handle2 = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable2 = await handle2.createWritable();
  await writable2.write(new Blob([content]));
  await writable2.close();
  const text = await cosReadText(hash);
  assert_equals(text, content);
}, 'writing identical bytes under an already-stored hash succeeds and reads back unchanged');

promise_test(async t => {
  // A create request always returns a handle, whether or not the entry
  // already exists and whether or not it is already written -- the caller
  // still has to supply bytes through it.
  const content = cosUniqueContent('create-on-existing');
  const {hash} = await cosStore(content);
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  assert_true(handle instanceof FileSystemFileHandle);
}, 'requestFileHandle({create:true}) returns a handle even when the entry already exists and is written');

promise_test(async t => {
  const content = cosUniqueContent('getFile-returns-File');
  const {hash} = await cosStore(content);
  const handle = await navigator.crossOriginStorage.requestFileHandle(hash);
  const file = await handle.getFile();
  assert_true(file instanceof File);
  assert_equals(await file.text(), content);
}, 'requestFileHandle() read returns a handle whose getFile() resolves to a File with the stored bytes');
