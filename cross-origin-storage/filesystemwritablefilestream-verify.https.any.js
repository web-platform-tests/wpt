// META: global=window,worker
// META: script=resources/helpers.js
//
// COS's "verify and store" steps run whenever a FileSystemWritableFileStream
// addressing a COS entry closes, regardless of how its final byte sequence
// was assembled -- multiple writes, seeks, truncates, or a piped stream all
// close the same way. https://wicg.github.io/cross-origin-storage/#creating-and-writing-files

'use strict';

promise_test(async t => {
  // The final bytes, not the naive concatenation of write() calls in call
  // order, must be what gets hashed: write forward, then seek back and
  // overwrite part of what was already written.
  const finalContent = 'AAAAABBBBB';
  const value = await cosSha256Hex(finalContent);
  const hash = cosHash(value);
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable = await handle.createWritable();
  await writable.write('AAAAAXXXXX');
  await writable.seek(5);
  await writable.write('BBBBB');
  await writable.close();
  assert_equals(await cosReadText(hash), finalContent);
}, 'verify and store hashes the final file contents after a seek-and-overwrite, not the write-call order');

promise_test(async t => {
  // Write more than intended, then truncate down to the bytes that actually
  // hash to the requested value.
  const finalContent = 'kept-bytes';
  const value = await cosSha256Hex(finalContent);
  const hash = cosHash(value);
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable = await handle.createWritable();
  await writable.write(finalContent + '-discarded-tail');
  await writable.truncate(finalContent.length);
  await writable.close();
  assert_equals(await cosReadText(hash), finalContent);
}, 'verify and store hashes the file contents after a truncate()');

promise_test(async t => {
  // A ReadableStream piped into the writable also closes it (by default),
  // which must trigger the same verify-and-store behavior as an explicit
  // close() call.
  const content = cosUniqueContent('piped-close');
  const value = await cosSha256Hex(content);
  const hash = cosHash(value);
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable = await handle.createWritable();
  const readable = new Blob([content]).stream();
  await readable.pipeTo(writable);
  assert_equals(await cosReadText(hash), content);
}, 'piping a ReadableStream to completion runs verify and store, same as an explicit close()');

promise_test(async t => {
  // A piped stream whose final bytes don't hash to the requested value must
  // surface the same DataError as an explicit mismatched write().
  const hash = cosMissingHash();
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable = await handle.createWritable();
  const readable = new Blob(['definitely not the right bytes']).stream();
  await promise_rejects_dom(t, 'DataError', readable.pipeTo(writable));
}, 'a piped stream with mismatched final bytes rejects the pipe with DataError');
