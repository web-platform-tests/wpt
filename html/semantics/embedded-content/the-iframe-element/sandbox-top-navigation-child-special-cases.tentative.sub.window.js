// META: title=Top-level navigation tests with cross origin & user activated child frames
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/resources/testharness.js
// META: script=/resources/testharnessreport.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=./resources/sandbox-top-navigation-helper.js

'use strict';

/* ------------------------- USER ACTIVATION TESTS ------------------------- */

promise_test(async t => {
  // There were flakes associated with nested iframes being created but not
  // getting access to the test_driver object, which would cause it to not be
  // able to get user activation. This is a workaround that uses a manually
  // created html page to attempt the top-level navigation and report the result
  // back to the test using postMessage().
  const main = await setupTest();
  await main.executeScript(() => {
    const iframe_1 = document.createElement("iframe");
    iframe_1.src ="/html/semantics/embedded-content/the-iframe-element/"
        + "resources/top-with-user-activation.html";
    document.body.appendChild(iframe_1);
    return new Promise((res, rej) => {
      window.onmessage = (e) => {
        if (e.data == "pass")
          res(e.data);
        else
          rej(e.data);
      }
    });

  });
}, "Allow top with user activation + user activation");

promise_test(async t => {
  const main = await setupTest();
  const iframe_1 = await createNestedIframe(main,
      "HTTP_ORIGIN", "allow-top-navigation-by-user-activation", "");

  await attemptTopNavigation(iframe_1, false);
}, "allow-top-navigation-by-user-activation set but no sticky activation");

/* ---------------------- CROSS ORIGIN (A -> B) TESTS ---------------------- */

promise_test(async t => {
  const main = await setupTest();
  const iframe_1 = await createNestedIframe(main,
      "HTTP_REMOTE_ORIGIN", "allow-top-navigation", "");

  await attemptTopNavigation(iframe_1, true);
}, "A cross-origin frame with frame sandbox flags can navigate top");

promise_test(async t => {
  const main = await setupTest();
  const iframe_1 = await createNestedIframe(main,
      "HTTP_REMOTE_ORIGIN", "", "allow-top-navigation");

  await attemptTopNavigation(iframe_1, false);
}, "A cross-origin frame with delivered sandbox flags can not navigate top");
