// META: title=Testing BFCache support for page with open IndexedDB connection, and cached page will not block open request from active page.
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/utils.js
// META: script=resources/support.js
// META: script=/html/browsers/browsing-the-web/back-forward-cache/resources/rc-helper.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: timeout=long

'use strict';

promise_test(async t => {
  const rcHelper = new RemoteContextHelper();

  // Open a window with noopener so that BFCache will work.
  const rc1 = await rcHelper.addWindow(
      /*config=*/ null, /*options=*/ {features: 'noopener'});

  const prefix = t.name + Math.random();
  const dbname1 = prefix + "_1";
  const dbname2 = prefix + "_2";
  // Ensure the page can enter back forward cache with open connection.
  await waitUntilIndexedDBOpenForTesting(rc1, dbname1, 1);
  await assertBFCacheEligibility(rc1, /*shouldRestoreFromBFCache=*/ true);

  // Create a new database connection for testing.
  await waitUntilIndexedDBOpenForTesting(rc1, dbname2, 1);

  // Navigate to a new page; the old page should be put in cache.
  const rc2 = await rc1.navigateToNew();

  // Opening a new database connection with higher version should succeed 
  // because page with open connection is in cache. The open connection 
  // should be closed to unblock requests from active page.
  await waitUntilIndexedDBOpenForTesting(rc2, dbname2, 2);

  // Navigate back to old page and ensure versionchange event is
  // not fired because versionchange event handler is not
  // expected to run after database version has been upgraded.
  await rc2.historyBack();
  assert_false(await rc1.executeScript(() => {
    // This should be unset or false.
    return !!window.versionChangedEventFired;
  }));
});
