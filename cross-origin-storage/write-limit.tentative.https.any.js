// META: global=window,dedicatedworker
// META: script=resources/helpers.js
//
// https://wicg.github.io/cross-origin-storage/#storage-limits
//
// Every top-level site has a COS write limit on how many files and how many
// bytes its pages store. Its size is implementation-defined, so this file
// checks the part that holds whatever the size: rewriting bytes this origin
// already stored under the same top-level site is free. If it were charged,
// the rewrites below would run past any limit small enough to stop a tracker.
// write-limit-exhaustion.tentative.optional.https.html checks the limit itself.

'use strict';

// Well above the few dozen small files a write limit has to stop.
const REWRITES = 64;

promise_test(async t => {
  const content = cosUniqueContent('write-limit-rewrite');
  const hash = cosHash(await cosSha256Hex(content));
  for (let i = 0; i < REWRITES; ++i) {
    const handle = await navigator.crossOriginStorage.getFileHandle(
      hash, {create: true});
    const writable = await handle.createWritable();
    await writable.write(new Blob([content]));
    await writable.close();
  }
  assert_equals(await cosReadText(hash), content);
}, 'rewriting a file this origin already stored under this top-level site is never charged to the write limit');
