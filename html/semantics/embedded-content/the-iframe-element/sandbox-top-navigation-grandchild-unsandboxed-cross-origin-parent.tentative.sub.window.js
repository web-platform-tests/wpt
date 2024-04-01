// META: title=Top-level navigation tests with grandchild frames
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
  const iframe_1 = await createNestedIframe(main, 'HTTP_REMOTE_ORIGIN', '', '');

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

  const iframe_2_url = new URL(
      '/html/semantics/embedded-content/the-iframe-element/resources/' +
          'top-navigation.sub.html',
      location.origin);
  await createNestedIframeWithSrc(iframe_1, iframe_2_url, '', '');
  await promise;
}, 'A same-origin grandchild in a cross-origin parent can navigate top');
