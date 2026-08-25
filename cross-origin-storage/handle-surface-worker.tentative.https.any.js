// META: global=dedicatedworker
// META: script=resources/helpers.js
//
// createSyncAccessHandle() is [Exposed=DedicatedWorker], so it does not exist
// on a COS handle in a Window at all and can only be exercised here.
// https://wicg.github.io/cross-origin-storage/#cos-file-system

'use strict';

promise_test(async t => {
  const content = cosUniqueContent('sync-access-handle');
  const {hash} = await cosStore(content);
  const handle = await navigator.crossOriginStorage.requestFileHandle(hash);

  assert_equals(typeof handle.createSyncAccessHandle, 'function',
    'the method is exposed on FileSystemFileHandle in a dedicated worker');

  // SPEC GAP: the specification does not define createSyncAccessHandle() on a
  // COS handle, and this test picks "NotSupportedError".
  //
  // That it must refuse is not really open: a sync access handle hands the
  // caller a writable file descriptor, which would let it change an entry's
  // bytes out from under the hash they are stored against -- and every other
  // origin with access reads those same bytes. Allowing it would end
  // content-addressability. Only the error name is a guess;
  // InvalidStateError is the plausible alternative, on the reading that the
  // handle is in a state that cannot produce one.
  await promise_rejects_dom(t, 'NotSupportedError',
    handle.createSyncAccessHandle());

  // As with remove(), prove the entry is untouched rather than trusting the
  // rejection alone.
  const after = await navigator.crossOriginStorage.requestFileHandle(hash);
  assert_equals(await (await after.getFile()).text(), content,
    'the entry must be unchanged after a refused createSyncAccessHandle()');
}, 'createSyncAccessHandle() rejects: it would allow mutating verified bytes');
