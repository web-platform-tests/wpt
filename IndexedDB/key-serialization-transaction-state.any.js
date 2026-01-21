// META: script=resources/support-promises.js
// META: title=Indexed DB transaction state during Structured Serializing
// META: timeout=long
'use strict';

const setupKetSerializationTest = async (testCase) => {
  const db = await createDatabase(testCase, database => {
    const objectStore = database.createObjectStore('store');
    objectStore.createIndex('idx', 'name');
    objectStore.put({ name: 'a' }, 0);
  });

  const transaction = db.transaction(['store'], 'readwrite');
  const objectStore = transaction.objectStore('store');
  const index = objectStore.index('idx');

  return { db, transaction, objectStore, index };
};

const testKeySerialization = async (db, testCase, transaction, objectStore, callback) => {
  let getterCalled = false;

  const activeKey = ['value that should not be used'];
  Object.defineProperty(activeKey, '0', {
    enumerable: true,
    get: testCase.step_func(() => {
      getterCalled = true;
      assert_throws_dom('TransactionInactiveError', () => {
        objectStore.get('key');
      }, 'transaction should not be active during key serialization');
      return 'value that should not be used';
    }),
  });

  callback(activeKey)

  await promiseForTransaction(testCase, transaction);
  db.close();

  assert_true(getterCalled,
    "activeKey's getter should be called during test");
};

promise_test(async testCase => {
  const { db, transaction, objectStore } = await setupKetSerializationTest(testCase);

  await testKeySerialization(db, testCase, transaction, objectStore, activeKey => {
    objectStore.add({}, activeKey);
  });
}, 'Transaction inactive during key serialization in IDBObjectStore.add()');

promise_test(async testCase => {
  const { db, transaction, objectStore } = await setupKetSerializationTest(testCase);

  await testKeySerialization(db, testCase, transaction, objectStore, activeKey => {
    objectStore.put({}, activeKey);
  });
}, 'Transaction inactive during key serialization in IDBObjectStore.put()');

promise_test(async testCase => {
  const { db, transaction, objectStore } = await setupKetSerializationTest(testCase);

  const cursor = await new Promise((resolve, reject) => {
    const cursorReq = objectStore.openCursor();
    cursorReq.onerror = reject;
    cursorReq.onsuccess = e => resolve(e.target.result);
  });

  await testKeySerialization(db, testCase, transaction, objectStore, activeKey => {
    cursor.continue(activeKey);
  });
}, 'Transaction inactive during key serialization in IDBCursor.continue()');

promise_test(async testCase => {
  const { db, transaction, objectStore, index } = await setupKetSerializationTest(testCase);

  const cursor = await new Promise((resolve, reject) => {
    const cursorReq = index.openCursor();
    cursorReq.onerror = reject;
    cursorReq.onsuccess = e => resolve(e.target.result);
  });

  await testKeySerialization(db, testCase, transaction, objectStore, activeKey => {
    cursor.continuePrimaryKey(activeKey, 0);
  });
}, 'Transaction inactive during key serialization in IDBCursor.continuePrimaryKey()');

promise_test(async testCase => {
  const { db, transaction, objectStore, index } = await setupKetSerializationTest(testCase);

  const cursor = await new Promise((resolve, reject) => {
    const cursorReq = index.openCursor();
    cursorReq.onerror = reject;
    cursorReq.onsuccess = e => resolve(e.target.result);
  });

  await testKeySerialization(db, testCase, transaction, objectStore, activeKey => {
    cursor.continuePrimaryKey(0, activeKey);
  });
}, 'Transaction inactive during primary key serialization in IDBCursor.continuePrimaryKey()');