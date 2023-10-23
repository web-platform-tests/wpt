// META: title=StorageManager: estimate() for indexeddb
// META: script=/storage/buckets/resources/util.js

promise_test(async t => {
  const arraySize = 1e6;
  const objectStoreName = 'storageManager';
  const dbname = location + t.name;

  const db =
      await indexedDbOpenRequest(t, indexedDB, dbname, (db_to_upgrade) => {
        db_to_upgrade.createObjectStore(objectStoreName);
      });

  let before = (await navigator.storage.estimate()).usage;
  const txn = db.transaction(objectStoreName, 'readwrite');
  const view = new Uint8Array(arraySize);

  txn.objectStore(objectStoreName).add(view, 1);

  await transactionPromise(txn);

  let after = (await navigator.storage.estimate()).usage;
  assert_equals(
    after, before,
    'estimated usage should increase after large value is stored');
}, 'estimate() shows usage increase after large value is stored 5');
