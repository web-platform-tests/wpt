// META: script=resources/support-promises.js
'use strict';

promise_test(async testCase => {
  // Add some databases and close their connections.
  const db1 = await createNamedDatabase(testCase, "DB1", () => {});
  const db2 = await createNamedDatabase(testCase, "DB2", () => {});
  db1.close();
  db2.close();

  // Delete any databases that may not have been cleaned up after previous test
  // runs as well as the two databases made above.
  await deleteAllDatabases(testCase);

  // Make sure the databases are no longer returned.
  const databases_result = await indexedDB.databases();
  assert_equals(
      databases_result.length,
      0,
      "The result of databases() should be an empty sequence for the case of "
      + "no databases for the origin.");
}, "Make sure an empty list is returned for the case of no databases.");
