'use strict';

// Size of large objects. This should exceed the size of a block in the storage
// method underlying the browser's IndexedDB implementation. For example, this
// needs to exceed the LevelDB block size on Chrome, and the SQLite block size
// on Firefox.
const largeObjectSize = 48 * 1024;

function largeObjectValue(cursorIndex, itemIndex) {
  // We use a typed array (as opposed to a string) because IndexedDB
  // implementations may serialize strings using UTF-8 or UTF-16, yielding
  // larger IndexedDB entries than we'd expect. It's very unlikely that an
  // IndexedDB implementation would use anything other than the raw buffer to
  // serialize a typed array.
  const buffer = new Uint8Array(largeObjectSize);

  // Some IndexedDB implementations, like LevelDB, compress their data blocks
  // before storing them to disk. We use a simple 32-bit xorshift PRNG, which
  // should be sufficient to foil any fast generic-purpose compression scheme.

  // 32-bit xorshift - the seed can't be zero
  let state = 1000 + (cursorIndex * itemCount + itemIndex);

  for (let i = 0; i < largeObjectSize; ++i) {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    buffer[i] = state & 0xff;
  }

  return buffer;
}

// Writes the objects to be read by one cursor. Returns a promise that resolves
// when the write completes.
//
// We want to avoid creating a large transaction, because that is outside the
// test's scope, and it's a bad practice. So we break up the writes across
// multiple transactions. For simplicity, each transaction writes all the
// objects that will be read by a cursor.
function writeCursorObjects(database, cursorIndex) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('cache', 'readwrite');
    transaction.onabort = () => { reject(transaction.error); };

    const store = transaction.objectStore('cache');
    for (let i = 0; i < itemCount; ++i) {
      store.put({
          key: objectKey(cursorIndex, i), value: objectValue(cursorIndex, i)});
    }
    transaction.oncomplete = resolve;
  });
}

// Returns a promise that resolves when the store has been populated.
function populateTestStore(testCase, database, cursorCount) {
  let promiseChain = Promise.resolve();

  for (let i = 0; i < cursorCount; ++i)
    promiseChain = promiseChain.then(() => writeCursorObjects(database, i));

  return promiseChain;
}

// A bank of cursors that can be used in an interleaved or parallel manner.
class CursorBank {
  constructor(testCase, store, cursorCount) {
    this.testCase = testCase;
    this.store = store;
    this.itemCount = itemCount;

    // The cursors used for iteration are stored here so each cursor's onsuccess
    // handler can call continue() on the next cursor.
    this.cursors = [];

    // The results of IDBObjectStore.openCursor() calls are stored here so we
    // we can change the requests' onsuccess handler after every
    // IDBCursor.continue() call.
    this.requests = [];
  }

  // Asserts that a cursor's key and value match the expectation.
  checkCursorState(cursorIndex, itemIndex) {
    this.testCase.step(() => {
      const cursor = this.cursors[cursorIndex];

      if (itemIndex < this.itemCount) {
        assert_equals(cursor.key, objectKey(cursorIndex, itemIndex));
        assert_equals(cursor.value.key, objectKey(cursorIndex, itemIndex));
        assert_equals(
            cursor.value.value.join('-'),
            objectValue(cursorIndex, itemIndex).join('-'));
      } else {
        assert_equals(cursor, null);
      }
    });
  }

  // Opens a cursor. The callback is called when the cursor open succeeds.
  openCursor(cursorIndex, callback) {
    this.testCase.step(() => {
      const request = this.store.openCursor(IDBKeyRange.bound(
          objectKey(cursorIndex, 0), objectKey(cursorIndex, this.itemCount)));
      this.requests[cursorIndex] = request;

      request.onsuccess = this.testCase.step_func(() => {
        const cursor = request.result;
        this.cursors[cursorIndex] = cursor;
        this.checkCursorState(cursorIndex, 0);
        callback();
      });
      request.onerror = () => {
        this.testCase.unreached_func(
            `IDBObjectStore.openCursor failed: ${request.error}`);
      };
    });
  }

  // Reads the next item available in the cursor. The callback is called when
  // the read suceeds.
  continueCursor(cursorIndex, itemIndex, callback) {
    this.testCase.step(() => {
      const request = this.requests[cursorIndex];
      request.onsuccess = this.testCase.step_func(() => {
        const cursor = request.result;
        this.cursors[cursorIndex] = cursor;
        this.checkCursorState(cursorIndex, itemIndex);
        callback();
      });
      request.onerror = this.testCase.unreached_func(
          `IDBCursor.continue() failed: ${request.error}`);
      request.onerror = () => {
        this.testCase.unreached_func(
            `IDBCursor.continue() failed: ${request.error}`);
      };

      const cursor = this.cursors[cursorIndex];
      cursor.continue();
    });
  }
}

// Reads cursors in an interleaved fashion, as shown below. Returns a promise
// that resolves when the reading is done.
//
// Given N cursors, each of which points to the beginning of a K-item sequence,
// the following accesses will be made.
//
// OC(i)    = open cursor i
// RD(i, j) = read result of cursor i, which should be at item j
// REND(i)  = read result of cursor i, which should be at the end of items
// CC(i)    = continue cursor i
// |        = wait for onsuccess on the previous OC or CC
//
// OC(1)            | RD(1, 1) OC(2) | RD(2, 1) OC(3) | ... | RD(n-1, 1) CC(n) |
// RD(n, 1)   CC(1) | RD(1, 2) CC(2) | RD(2, 2) CC(3) | ... | RD(n-1, 2) CC(n) |
// RD(n, 2)   CC(1) | RD(1, 3) CC(2) | RD(2, 3) CC(3) | ... | RD(n-1, 3) CC(n) |
// ...
// RD(n, k-1) CC(1) | RD(1, k) CC(2) | RD(2, k) CC(3) | ... | RD(n-1, k) CC(n) |
// RD(n)      CC(1) | REND(1)  CC(2) | REND(2)  CC(3) | ... | REND(n-1)  CC(n) |
// REND(n)            done
function interleaveCursors(testCase, store, cursorCount, itemCount) {
  return new Promise((resolve, reject) => {
    const cursors = new CursorBank(testCase, store, itemCount);

    // We open all the cursors one at a time, then cycle through the cursors and
    // call continue() on each of them. This access pattern causes maximal
    // trashing to an LRU cursor cache. Eviction scheme aside, any cache will
    // have to evict some cursors, and this access pattern verifies that the
    // cache correctly restores the state of evicted cursors.
    const steps = [];
    for (let cursorIndex = 0; cursorIndex < cursorCount; ++cursorIndex)
      steps.push(cursors.openCursor.bind(cursors, cursorIndex));
    for (let itemIndex = 1; itemIndex <= itemCount; ++itemIndex) {
      for (let cursorIndex = 0; cursorIndex < cursorCount; ++cursorIndex) {
        steps.push(
            cursors.continueCursor.bind(cursors, cursorIndex, itemIndex));
      }
    }

    const runStep = (stepIndex) => {
      if (stepIndex === steps.length) {
        resolve();
        return;
      }
      steps[stepIndex](testCase.step_func(() => { runStep(stepIndex + 1); }));
    };
    runStep(0);
  });
}
