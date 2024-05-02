// META: title=Top-level navigation tests with cross origin & user activated child frames
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=./resources/sandbox-top-navigation-helper.sub.js

'use strict';

promise_test(async t => {
  const main = await setupTest();
  const iframe_url = new URL(
      '/html/semantics/embedded-content/the-iframe-element/resources/' +
          'top-navigation.sub.html',
      get_host_info().HTTP_REMOTE_ORIGIN);
  let promise = new Promise((resolve, reject) => {
    window.onmessage =
        msg => {
          if (msg.data == 'success') {
            resolve('The top-level navigation was successful.');
          } else {
            reject('The top-level navigation was not successful.');
          }
        }
  });

  await createNestedIframeWithSrc(main, iframe_url, 'allow-top-navigation');
  await promise;
}, 'A cross-origin frame with frame sandbox flags can navigate top');
