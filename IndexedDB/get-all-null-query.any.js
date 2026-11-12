// META: title=IndexedDB: get all with null or undefined queries
// META: global=window,worker
// META: script=resources/support.js

'use strict';

for (const source of ['object store', 'index']) {
  const keys = source === 'index' ? ['a', 'b', 'c'] : [1, 2, 3];
  const primaryKeys = source === 'index' ? [2, 3, 1] : [1, 2, 3];
  const values = source === 'index' ? ['a', 'b', 'c'] : ['c', 'a', 'b'];

  function runTest(method, args, expectedPositions, description) {
    indexeddb_test(
        (t, db) => {
          const store = db.createObjectStore('store');
          store.createIndex('index', '');
          // Index order deliberately differs from primary-key order.
          store.put('c', 1);
          store.put('a', 2);
          store.put('b', 3);
        },
        (t, db) => {
          const transaction = db.transaction('store');
          const store = transaction.objectStore('store');
          const target = source === 'index' ? store.index('index') : store;
          const request = target[method](...args);
          request.onerror = t.unreached_func('The request must succeed');
          request.onsuccess = t.step_func(() => {
            const result = request.result;
            if (method === 'getAllRecords') {
              assert_equals(result.length, expectedPositions.length);
              expectedPositions.forEach((position, i) => {
                assert_equals(result[i].key, keys[position], 'record key');
                assert_equals(
                    result[i].primaryKey, primaryKeys[position], 'primary key');
                assert_equals(result[i].value, values[position], 'record value');
              });
            } else {
              const expected = method === 'getAll' ? values : primaryKeys;
              assert_array_equals(
                  result, expectedPositions.map(position => expected[position]));
            }
          });
          transaction.oncomplete = t.step_func_done();
        },
        `${source}.${method}(): ${description}`);
  }

  for (const method of ['getAll', 'getAllKeys']) {
    runTest(method, [], [0, 1, 2], 'omitted query returns all in next order');
    for (const query of [undefined, null]) {
      runTest(
          method, [query], [0, 1, 2],
          `${query} query returns all in next order`);
      runTest(
          method, [query, 0], [0, 1, 2],
          `${query} query with count 0 returns all in next order`);
      runTest(
          method, [query, 2], [0, 1],
          `${query} query preserves count 2 and next order`);
    }
  }

  // getAllRecords takes a dictionary, not a separate query and count.
  runTest(
      'getAllRecords', [], [0, 1, 2],
      'omitted options returns all in next order');
  for (const query of [undefined, null]) {
    runTest(
        'getAllRecords', [query], [0, 1, 2],
        `${query} options returns all in next order`);
    runTest(
        'getAllRecords', [{query, count: 2, direction: 'prev'}], [2, 1],
        `${query} dictionary query preserves count 2 and prev direction`);
  }
}
