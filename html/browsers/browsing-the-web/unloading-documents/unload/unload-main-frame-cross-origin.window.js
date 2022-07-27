// META: title=Unload runs in main frame when navigating cross-origin.
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=/resources/testharness.js
// META: script=/resources/testharnessreport.js

promise_test(async t => {
  const rcHelper = new RemoteContextHelper();

  const rc1 = await rcHelper.addWindow();

  // Initialize storage and add "unload" event handler.
  await rc1.executeScript(() => {
    localStorage.setItem("unload", "not yet");
    addEventListener("unload", () => {
      localStorage.setItem("unload", "ran");
    });
  })

  // Navigate away.
  const rc2 = await rc1.navigateToNew({ extraRemoteContextConfig: { origin: "HTTP_REMOTE_ORIGIN" } });

  // Navigate back.
  await historyBack(rc2);

  // Test that the unload handler wrote to storage.
  assert_equals(await rc1.executeScript(() => localStorage.getItem("unload")), "ran");
});
