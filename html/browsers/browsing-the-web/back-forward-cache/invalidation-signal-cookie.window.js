// META: title=Testing if modifying cookie invalidation signals can evict a BFCache entry expectedly.
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/utils.js
// META: script=/IndexedDB/resources/support.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=resources/rc-helper.js

'use strict';

promise_test(async t => {
  const rcHelper = new RemoteContextHelper();

  // Open a window with noopener so that BFCache will work.
  const rc1 = await rcHelper.addWindow(
      /*config=*/ null, /*options=*/ { features: 'noopener' });

  // If the invalidation signals API is not supported, raise
  // a `PRECONDITION_FAILED`.
  assert_implements_invalidation_signal_api();

  // Set the cookie invalidation signals.
  await rc1.executeScript(() => {
    window.inactiveDocumentController.invalidationSignals.setCookie(
      ['key']
    );
  });

  const rc2 = await rc1.navigateToNew();
  // Let `rc2` modifies the invalidation signals, `rc1` should be evicted.
  await rc2.executeScript(() => {
    window.document.cookie = 'key=value';
  });
  await rc2.historyBack();
  // TODO (leimy): Use `notRestoreReason` API to check the reason after
  // it's released.
  await assert_not_bfcached(rc1);
});
