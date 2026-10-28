'use strict';

directory_test(async (t, root) => {
  const fileContents = 'awesome content';
  let handle =
      await createFileWithContents('foo.txt', fileContents, /*parent=*/ root);
  let file = await handle.getFile();
  let slice = file.slice(1, file.size);
  let actualContents = await slice.text();
  assert_equals(actualContents, fileContents.slice(1, fileContents.length));
}, 'getFile() provides a file that can be sliced');

directory_test(async (t, root) => {
  const handle = await createEmptyFile('mtime.txt', root);
  let file = await handle.getFile();
  const first_mtime = file.lastModified;

  // We wait for 2s here to ensure that the files do not have the
  // same modification time. Some filesystems have low resolutions
  // for modification timestamps.
  let timeout = new Promise(resolve => {
    t.step_timeout(resolve, 2000);
  });
  await timeout;

  const writer = await handle.createWritable({keepExistingData: false});
  await writer.write(new Blob(['foo']));
  await writer.close();

  file = await handle.getFile();
  const second_mtime = file.lastModified;

  // We wait for 5 ms here to ensure that `lastModified`
  // from the File objects is stable between getFile invocations.
  timeout = new Promise(resolve => {
    t.step_timeout(resolve, 5);
  });
  await timeout;
  let fileReplica = await handle.getFile();
  assert_equals(second_mtime, fileReplica.lastModified);

  assert_less_than(first_mtime, second_mtime);
}, 'getFile() returns last modified time');

directory_test(async (t, root) => {
  const fileName = "fileAttributesTest.txt";

  const fileHandle = await createEmptyFile(fileName, root);
  assert_equals(fileHandle.name, fileName);

  const file = await fileHandle.getFile();
  assert_equals(file.name, fileName);
}, 'getFile() returns expected name');

// Ways to change the entry behind a File returned by getFile(), and the
// DOMException the File API requires when reading the stale File afterwards.
const kInvalidations = [
  {
    description: 'removeEntry()',
    invalidate: async (t, root, handle) => root.removeEntry(handle.name),
    error: 'NotFoundError',
  },
  {
    description: 'createWritable()',
    invalidate: async (t, root, handle, contents = kModifiedContents) => {
      const writer = await cleanup_writable(t, await handle.createWritable());
      await writer.write(contents);
      await writer.close();
    },
    error: 'NotReadableError',
  },
];

for (const {description: invalidateDesc, invalidate, error} of kInvalidations) {
  directory_test(async (t, root) => {
    const handle =
        await createFileWithContents('file.txt', kOriginalContents, root);
    const file = await handle.getFile();

    const text = await file.text();
    const buffer = await file.arrayBuffer();
    const lastModified = file.lastModified;

    await invalidate(t, root, handle);

    assert_equals(text, kOriginalContents, 'text() result is unchanged');
    assert_equals(
        new TextDecoder().decode(buffer), kOriginalContents,
        'arrayBuffer() result is unchanged');
    assert_equals(file.name, handle.name, 'name is unchanged');
    assert_equals(file.size, kOriginalContents.length, 'size is unchanged');
    assert_equals(file.lastModified, lastModified, 'lastModified is unchanged');
  }, `Data read from a getFile() File before ${invalidateDesc} stays valid`);

  for (const {description: readerDesc, read} of kReaders) {
    directory_test(async (t, root) => {
      await promise_rejects_read(
          t, error, readAfterChange(t, root, invalidate, sameBlob, read),
          readerDesc);
    }, `Reading a getFile() File with ${readerDesc} after ` +
           `${invalidateDesc} rejects`);
  }

  for (const {description: blobDesc, derive} of kDerivedBlobs) {
    directory_test(async (t, root) => {
      await promise_rejects_read(
          t, error, readAfterChange(t, root, invalidate, derive, textOf),
          blobDesc + ' the File');
    }, `${blobDesc} a getFile() File is invalidated by ${invalidateDesc}`);
  }

  directory_test(async (t, root) => {
    const sliceAfterChange = file => {
      const slice = file.slice(1, file.size);
      assert_equals(slice.size, file.size - 1, 'slice() itself succeeds');
      return textOf(slice);
    };
    await promise_rejects_read(
        t, error,
        readAfterChange(t, root, invalidate, sameBlob, sliceAfterChange),
        'a slice created after the change');
  }, `A slice of a getFile() File created after ${invalidateDesc} ` +
         'is invalidated');

  directory_test(async (t, root) => {
    const handle =
        await createFileWithContents('file.txt', kOriginalContents, root);
    const file = await handle.getFile();

    const fromBuffer = new Blob([await file.arrayBuffer()]);
    const fromText = new Blob([await file.text()]);

    await invalidate(t, root, handle);

    assert_equals(
        await fromBuffer.text(), kOriginalContents,
        'Blob built from arrayBuffer() result is readable');
    assert_equals(
        await fromText.text(), kOriginalContents,
        'Blob built from text() result is readable');
  }, `Blobs built from data read before ${invalidateDesc} stay readable`);

  directory_test(async (t, root) => {
    const handle =
        await createFileWithContents('file.txt', kLargeContents, root);
    const file = await handle.getFile();
    const reader = file.stream().getReader();
    const firstChunk = await readFirstChunk(reader);
    assert_less_than(
        firstChunk.length, file.size, 'first chunk does not cover the file');

    await invalidate(t, root, handle, kLargeModifiedContents);

    await promise_rejects_read(
        t, error, readRemainingChunks(reader), 'remaining chunks');
  }, 'A stream() read of a getFile() File in progress during ' +
         `${invalidateDesc} rejects`);
}
