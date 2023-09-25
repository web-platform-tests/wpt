// META: title=RemoteContextHelper navigation using BFCache
// META: script=./test-helper.js
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/html/browsers/browsing-the-web/back-forward-cache/resources/rc-helper.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=/websockets/constants.sub.js
// META: timeout=long

'use strict';

// Ensure that notRestoredReasons is populated when not restored.
promise_test(async t => {
  const rcHelper = new RemoteContextHelper();
  // Open a window with noopener so that BFCache will work.
  const rc1 = await rcHelper.addWindow(
      /*config=*/ null, /*options=*/ {features: 'noopener'});
  // Use WebSocket to block BFCache.
  await useWebSocket(rc1);
  const rc1_url = await rc1.executeScript(() => {
    return location.href;
  });

  // Check the BFCache result and the reported reasons.
  await assertBFCacheEligibility(rc1, /*shouldRestoreFromBFCache=*/ false);
  await assertNotRestoredFromBFCache(rc1, ['websocket']);

  // Check that the page is stored in back/forward cache this time, now that
  // WebSocket is no longer used.
  await assertBFCacheEligibility(rc1, /*shouldRestoreFromBFCache=*/ true);
  // Ensure that the reasons are null.
  const result = await rc1.executeScript(() => {
    return performance.getEntriesByType('navigation')[0].notRestoredReasons;
  });
  assert_equals(result, null);
});