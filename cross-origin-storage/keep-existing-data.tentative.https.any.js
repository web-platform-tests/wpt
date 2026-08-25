// META: global=window,worker
// META: script=resources/helpers.js
//
// createWritable({keepExistingData: true}) on a COS entry, which is a
// disclosure question rather than a convenience one.
// https://wicg.github.io/cross-origin-storage/#creating-and-writing-files
//
// SPEC GAP: the specification does not mention keepExistingData at all, so it
// does not say whether a create-request writable may be seeded with the bytes
// of an entry the caller cannot read. This test asserts it must not be, for
// the reason set out below; that reasoning is what should end up in the
// specification, not this file.

'use strict';

promise_test(async t => {
  // The dangerous shape. A create request for a hash *another* origin already
  // wrote hands back a handle whose `may read` is false: the caller has not
  // supplied the bytes and has not passed availability gating, so it must
  // learn nothing about the entry.
  //
  // If keepExistingData seeded the writable with the entry's existing bytes,
  // closing it without writing anything would produce a matching hash. The
  // caller would become a storing origin -- and so gain read access -- for
  // bytes it never possessed, with `origins`, the Public Hash List and
  // GREASE'ing never consulted. That is an availability-gating bypass built
  // out of two operations that are each individually permitted.
  //
  // This test uses the same origin storing then re-creating, which is the
  // benign case; it pins the mechanism rather than the attack, because a
  // cross-origin version cannot be written without a second origin that has
  // already stored the bytes. The mechanism is what must not exist.
  //
  // The DataError below *is* specified -- closing a writable whose bytes do
  // not hash to the requested value rejects with it -- so what this test adds
  // is that writing nothing must reach that path rather than succeeding. An
  // implementation that instead reports an I/O-flavoured failure for the
  // zero-write case is hiding a verification result behind a disk error.
  const content = cosUniqueContent('keep-existing-data');
  const {hash} = await cosStore(content);

  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable = await handle.createWritable({keepExistingData: true});

  // Close having written nothing. If existing data had been carried over, the
  // hash would match and this would resolve.
  await promise_rejects_dom(t, 'DataError', writable.close());
}, 'createWritable({keepExistingData:true}) does not seed the writable with the entry bytes');

promise_test(async t => {
  // The same guarantee stated positively: a create-request writable always
  // starts empty, so what lands is exactly what the caller wrote.
  const content = cosUniqueContent('keep-existing-data-roundtrip');
  const {hash} = await cosStore(content);

  const handle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const writable = await handle.createWritable({keepExistingData: true});
  await writable.write(new Blob([content]));
  await writable.close();

  assert_equals(await cosReadText(hash), content,
    'writing the full contents succeeds regardless of keepExistingData');
}, 'a keepExistingData writable still accepts a full, matching write');
