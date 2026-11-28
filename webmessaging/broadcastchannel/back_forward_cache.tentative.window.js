// META: title=Ensure that messages are not dropped in back/forward cache
// META: script=./test-helper.js
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/utils.js
// META: script=/html/browsers/browsing-the-web/back-forward-cache/resources/rc-helper.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js

'use strict';

promise_test(async t => {
  const rcHelper = new RemoteContextHelper();
  // Open a window with noopener so that BFCache will work.
  const rc1 = await rcHelper.addWindow(
      /*config=*/ null, /*options=*/ { features: 'noopener' });

  let channelName = "channel";

  // Listen on the channel.
  await rc1.executeScript((channelNameRemote) => {
    window.receivedData = new Promise(resolve => {
      let bc = new BroadcastChannel(channelNameRemote);
      bc.onmessage = (event) => {
        resolve(event.data);
      };
    })
  }, [channelName]);

  prepareForBFCache(rc1);

  // Navigate away.
  const rc2 = await rc1.navigateToNew();

  // Send a message.
  let messageData = "42";
  let bc = new BroadcastChannel(channelName);
  bc.postMessage(messageData);

  // Go back.
  await rc2.historyBack();

  // Check that BFCache is supported.
  await assertImplementsBFCacheOptional(rc1);

  // Check that the message was received.
  const receivedData = await rc1.executeScript(() => {
    return window.receivedData;
  });
  assert_equals(receivedData, messageData);
});
