// META: title=StorageManager: estimate() for indexeddb
// META: script=/storage/buckets/resources/util.js

promise_test(async t => {
  const arraySize = 1e6;
  const objectStoreName = 'storageManager';
  const dbname = location + t.name;

  let estimate = await navigator.storage.estimate();

  const usageBeforeCreate = estimate.usage;
  const db =
      await indexedDbOpenRequest(t, indexedDB, dbname, (db_to_upgrade) => {
        db_to_upgrade.createObjectStore(objectStoreName);
      });
  estimate = await navigator.storage.estimate();
  const usageAfterCreate = estimate.usage;

  assert_greater_than(
    usageAfterCreate, usageBeforeCreate,
    'estimated usage should increase after object store is created');

  const txn = db.transaction(objectStoreName, 'readwrite', { durability: 'relaxed'});
  const buffer = new ArrayBuffer(arraySize);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < arraySize; i++) {
    view[i] = Math.floor(Math.random() * 255);
  }

  txn.objectStore(objectStoreName).add(view, 1);

  await transactionPromise(txn);

  estimate = await navigator.storage.estimate();
  const usageAfterPut = estimate.usage;
  assert_greater_than(
    usageAfterPut, usageAfterCreate,
    'estimated usage should increase after large value is stored');
}, 'estimate() shows usage increase after large value is stored 3');


