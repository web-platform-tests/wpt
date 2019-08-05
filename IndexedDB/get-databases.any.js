// META: script=support-promises.js

console.log("test");

promise_test(async testCase => {
  assert_true(indexedDB.databases() instanceof Promise,
      "databases() should return a promise.");
}, "Ensure that databases() returns a promise.");

promise_test(async testCase => {
  // Delete any databases that may not have been cleaned up after previous test
  // runs.
  console.log("about to delete databases");
  await deleteAllDatabases(testCase);

  const db_name = "TestDatabase";
  console.log("about to createNamedDatabase");
  const db = await createNamedDatabase(testCase, db_name, ()=>{});
  console.log("done createNamedDatabase, about to call databases()");
  const databases_result = await indexedDB.databases();
  console.log("done databases()");
  db.close();
  const expected_result = {"name": db_name, "version": 1};
  assert_equals(
      databases_result.length,
      1,
      "The result of databases() should contain one result per database.");
  assert_true(
      databases_result[0].name === expected_result.name
          && databases_result[0].version === expected_result.version,
      "The result of databases() should be a sequence of the correct names "
      + "and versions of all databases for the origin.");
}, "Enumerate one database.");