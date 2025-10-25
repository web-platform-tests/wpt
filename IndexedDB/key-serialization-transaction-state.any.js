// META: script=resources/support-promises.js
// META: title=Indexed DB transaction state during Structured Serializing
// META: timeout=long
'use strict';

promise_test(async testCase => {
  const db = await createDatabase(testCase, database => {
    database.createObjectStore('store');
  });

  const transaction = db.transaction(['store'], 'readwrite');
  const objectStore = transaction.objectStore('store');

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
  objectStore.add({}, activeKey);
  await promiseForTransaction(testCase, transaction);
  db.close();

  assert_true(getterCalled,
              "activeKey's getter should be called during test");
}, 'Transaction inactive during key serialization in IDBObjectStore.add()');

promise_test(async testCase => {
  const db = await createDatabase(testCase, database => {
    database.createObjectStore('store');
  });

  const transaction = db.transaction(['store'], 'readwrite');
  const objectStore = transaction.objectStore('store');

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
  objectStore.put({}, activeKey);
  await promiseForTransaction(testCase, transaction);
  db.close();

  assert_true(getterCalled,
    "activeKey's getter should be called during test");
}, 'Transaction inactive during key serialization in IDBObjectStore.put()');
