'use strict';

importScripts('/resources/testharness.js');
importScripts('resources/sandboxed-fs-test-helpers.js');
importScripts('resources/test-helpers.js');
importScripts('resources/getfile-helpers.js');

// Overwrites the start of the file in place through a sync access handle.
async function writeInPlace(t, handle, contents) {
  const accessHandle = await handle.createSyncAccessHandle();
  t.add_cleanup(() => accessHandle.close());
  accessHandle.write(new TextEncoder().encode(contents), {at: 0});
  accessHandle.flush();
  accessHandle.close();
}

directory_test(async (t, root) => {
  const handle =
      await createFileWithContents('file.txt', kOriginalContents, root);
  const file = await handle.getFile();
  const text = await file.text();
  const lastModified = file.lastModified;

  await writeInPlace(t, handle, kModifiedContents + ' and more contents');

  assert_equals(text, kOriginalContents, 'text() result is unchanged');
  assert_equals(file.size, kOriginalContents.length, 'size is unchanged');
  assert_equals(file.lastModified, lastModified, 'lastModified is unchanged');
}, 'Data read from a getFile() File before a sync access handle write stays ' +
       'valid');

const writeModifiedInPlace = (t, root, handle) =>
    writeInPlace(t, handle, kModifiedContents);

for (const {description: readerDesc, read} of kReaders) {
  directory_test(async (t, root) => {
    await promise_rejects_read(
        t, 'NotReadableError',
        readAfterChange(t, root, writeModifiedInPlace, sameBlob, read),
        readerDesc);
  }, `Reading a getFile() File with ${readerDesc} after a sync access handle ` +
         'write rejects');
}

for (const {description: blobDesc, derive} of kDerivedBlobs) {
  directory_test(async (t, root) => {
    await promise_rejects_read(
        t, 'NotReadableError',
        readAfterChange(t, root, writeModifiedInPlace, derive, textOf),
        blobDesc + ' the File');
  }, `${blobDesc} a getFile() File is invalidated by a sync access handle ` +
         'write');
}

directory_test(async (t, root) => {
  const handle =
      await createFileWithContents('file.txt', kOriginalContents, root);
  const accessHandle = await handle.createSyncAccessHandle();
  t.add_cleanup(() => accessHandle.close());

  const file = await handle.getFile();
  accessHandle.write(new TextEncoder().encode(kModifiedContents), {at: 0});
  accessHandle.flush();

  await promise_rejects_read(t, 'NotReadableError', textOf(file), 'text()');
}, 'Reading a getFile() File obtained while a sync access handle is open ' +
       'rejects after a write');

directory_test(async (t, root) => {
  const handle =
      await createFileWithContents('file.txt', kLargeContents, root);
  const file = await handle.getFile();
  const reader = file.stream().getReader();
  const firstChunk = await readFirstChunk(reader);
  assert_less_than(
      firstChunk.length, file.size, 'first chunk does not cover the file');

  await writeInPlace(t, handle, kLargeModifiedContents);

  await promise_rejects_read(
      t, 'NotReadableError', readRemainingChunks(reader), 'remaining chunks');
}, 'A stream() read of a getFile() File in progress during a sync access ' +
       'handle write rejects');

done();
