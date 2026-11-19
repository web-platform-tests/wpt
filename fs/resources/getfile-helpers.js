'use strict';

// Helpers for tests of the File returned by FileSystemFileHandle.getFile()
// after the underlying entry is removed or modified.

const kOriginalContents = 'original contents';
const kModifiedContents = 'modified';
// Large enough that stream() delivers it in several chunks.
const kLargeSize = 4 * 1024 * 1024;
const kLargeContents = 'x'.repeat(kLargeSize);
const kLargeModifiedContents = 'y'.repeat(kLargeSize);

async function readFirstChunk(reader) {
  const {done, value} = await reader.read();
  return done ? '' : new TextDecoder().decode(value);
}

async function readRemainingChunks(reader) {
  const chunks = [];
  for (;;) {
    const {done, value} = await reader.read();
    if (done) {
      return new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
    }
    chunks.push(value);
  }
}

function describeContents(text) {
  if (text === kOriginalContents || text === kLargeContents) {
    return 'the original contents';
  }
  if (text === kModifiedContents || text === kLargeModifiedContents) {
    return 'the modified contents';
  }
  if (text.length > 0 && /^\0*$/.test(text)) {
    return `${text.length} zero bytes`;
  }
  if (text.length <= 64) {
    return `"${text}" (${text.length} chars)`;
  }
  let original = 0, modified = 0;
  for (const c of text) {
    if (c === 'x') {
      original++;
    } else if (c === 'y') {
      modified++;
    }
  }
  const other = text.length - original - modified;
  return `${text.length} chars: ${original} original, ${modified} modified, ` +
      `${other} other`;
}

// Like promise_rejects_dom(), for a promise resolving to the text read from
// a File. If the read unexpectedly succeeds, the failure message describes
// what was read.
async function promise_rejects_read(t, error, promise, description) {
  let text;
  try {
    text = await promise;
  } catch (e) {
    await promise_rejects_dom(t, error, Promise.reject(e), description);
    return;
  }
  assert_unreached(`${description} resolved with ${describeContents(text)}`);
}

function textOf(blob) {
  return blob.text();
}

async function textOfArrayBuffer(blob) {
  return new TextDecoder().decode(await blob.arrayBuffer());
}

function readFirstChunkFromBlob(blob) {
  return readFirstChunk(blob.stream().getReader());
}

// Ways to read the contents of a Blob as text.
const kReaders = [
  {description: 'text()', read: textOf},
  {description: 'arrayBuffer()', read: textOfArrayBuffer},
  {description: 'stream()', read: readFirstChunkFromBlob},
];

// Blobs that share their bytes with the File they are built from.
const kDerivedBlobs = [
  {description: 'A slice of', derive: file => file.slice(1, file.size)},
  {description: 'A Blob wrapping', derive: file => new Blob([file])},
  {
    description: 'A composite Blob containing',
    derive: file => new Blob(['prefix ', file, ' suffix'])
  },
];

const sameBlob = file => file;

// Resolves to the text that `read` extracts from the Blob `derive` built from
// a getFile() File, once `invalidate` has changed the entry behind the File.
async function readAfterChange(t, root, invalidate, derive, read) {
  const handle =
      await createFileWithContents('file.txt', kOriginalContents, root);
  const file = await handle.getFile();
  const blob = derive(file);

  await invalidate(t, root, handle);

  return read(blob);
}
