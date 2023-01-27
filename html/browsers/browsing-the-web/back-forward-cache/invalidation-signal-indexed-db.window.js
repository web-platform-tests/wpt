// META: title=Testing if modifying IndexedDB invalidation signals can evict a BFCache entry expectedly.
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/utils.js
// META: script=/IndexedDB/resources/support.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=resources/rc-helper.js

'use strict';

async function updateIndexedDBDataStore(rc, dbName) {
  await rc.executeScript(async (dbName) => {
    await new Promise((resolve, reject) => {
      let request = window.indexedDB.open(dbName, 1);
      request.onsuccess = () => {
        let transaction = request.result.transaction(['store'], 'readwrite');
        transaction.objectStore('store').put("key", "value");
        resolve();
      }
      request.onerror = (error) => reject(error);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('store');
      }
    });
  }, [dbName]);
}

promise_test(async t => {
  const rcHelper = new RemoteContextHelper();

  // Open a window with noopener so that BFCache will work.
  const rc1 = await rcHelper.addWindow(
      /*config=*/ null, /*options=*/ { features: 'noopener' });

  // If the invalidation signals API is not supported, raise
  // a `PRECONDITION_FAILED`.
  assert_implements_invalidation_signal_api();

  // Set the IndexedDB invalidation signals.
  await rc1.executeScript(() => {
    window.inactiveDocumentController.invalidationSignals.setIndexedDB(
      [{ 'database': 'db', 'object_store': 'store' }]
    );
  });

  const rc2 = await rc1.navigateToNew();
  // Let `rc2` modifies the invalidation signals, `rc1` should be evicted.
  await updateIndexedDBDataStore(rc2, 'db');
  await rc2.historyBack();
  // TODO (leimy): Use `notRestoreReason` API to check the reason after
  // it's released.
  await assert_not_bfcached(rc1);
});
