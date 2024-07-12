// META: title=RemoteContextHelper navigation using BFCache
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/html/browsers/browsing-the-web/back-forward-cache/resources/rc-helper.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper-tests/resources/test-helper.js
// META: timeout=long

'use strict';

// Ensure that notRestoredReasons reset after the server redirect.
promise_test(async t => {
  const rcHelper = new RemoteContextHelper();
  // Open a window with noopener so that BFCache will work.
  const rc1 = await rcHelper.addWindow(
      /*extraConfig=*/ {
        origin: 'HTTP_ORIGIN',
        scripts: [],
        headers: [],
      }, /*options=*/ {features: 'noopener'});

  const worker = await rc1.addWorker(
    {
      scripts: ['./resources/worker-with-broadcastchannel.js'],
      headers: [],
    },
  );

  await prepareForBFCache(rc1);
  const newRemoteContextHelper = await rc1.navigateToNew();
  await assertSimplestScriptRuns(newRemoteContextHelper);

  const rc2 = await rcHelper.addWindow(
    /*extraConfig=*/ {
      origin: 'HTTP_ORIGIN',
      scripts: ['./resources/broadcastchannel-sender.js'],
      headers: [],
    }, /*options=*/ {features: 'noopener'});

  const messages_before_back = await rc2.executeScript(() => {
    return messages;
  });
  assert_equals(messages_before_back.length, 0);

  await newRemoteContextHelper.historyBack();
  const messages_after_back = await rc2.executeScript(() => {
    return waitForEventsPromise(2);
  });
  assert_equals(messages_after_back.length, 2);

  assertImplementsBFCacheOptional(rc1);
});
