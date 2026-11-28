// META: title=RemoteContextHelper navigation to static page using BFCache
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=./resources/test-helper.js
// META: timeout=long

"use strict";

const STATIC_PAGE =
  "/html/browsers/browsing-the-web/remote-context-helper-tests/resources/bfcache-static-page.html";

promise_test(async (t) => {
  const rcHelper = new RemoteContextHelper();

  // Open the static page directly.
  const rc1 = await rcHelper.addWindow(
    { page: STATIC_PAGE },
    { features: "noopener" },
  );

  await assertSimplestScriptRuns(rc1);

  assert_equals(
    await rc1.executeScript(() => document.title),
    "Static page with in-flight image",
  );
  assert_equals(
    await rc1.executeScript(() => document.querySelector("img") !== null),
    true,
    "img element exists",
  );

  // The image is still loading (10s delay), so load should not have fired yet.
  assert_equals(
    await rc1.executeScript(() => window.loadFired),
    undefined,
    "load event should not have fired yet",
  );

  // Create a target context without navigating to it yet.
  const rc2 = await rcHelper.createContext({});

  // Navigate via a link click instead of window.location. A click on an <a>
  // is treated as a push navigation even when the load event hasn't fired.
  await rc1.clickTo(rc2.url);

  await assertSimplestScriptRuns(rc2);

  // Navigate back.
  await rc2.historyBack();

  // Check if the page was restored from BFCache.
  assert_implements_optional(
    await rc1.executeScript(() => {
      return window.pageshowEvent && window.pageshowEvent.persisted;
    }),
    "BFCache not supported",
  );

  // After restore, wait for the load event to eventually fire.
  // This is in underspeced territory. Load event do not fire for BFCache restore
  // but as this test proves, it never fires, its completely dropped (unless browser is passing)
  await rc1.executeScript(() => {
    return new Promise((resolve) => {
      if (window.loadFired) {
        resolve();
      } else {
        window.addEventListener("load", resolve);
      }
    });
  });
  assert_equals(
    await rc1.executeScript(() => window.loadFired),
    true,
    "load event should have fired after BFCache restore",
  );
}, "Static page with in-flight image can be BFCached");
