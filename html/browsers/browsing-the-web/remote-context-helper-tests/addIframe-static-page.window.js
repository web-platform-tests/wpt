// META: title=RemoteContextHelper addIframe with static page
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: script=./resources/test-helper.js

'use strict';

const STATIC_PAGE =
    '/html/browsers/browsing-the-web/remote-context-helper-tests/resources/simple-static-page.html';

promise_test(async t => {
  const rcHelper = new RemoteContextHelper();
  const rc1 = await rcHelper.addWindow();
  const rc2 = await rc1.addIframe({page: STATIC_PAGE});

  await assertSimplestScriptRuns(rc2);

  assert_equals(
      await rc2.executeScript(() => document.title),
      'Simple static page');
  assert_equals(
      await rc2.executeScript(() => document.querySelector('p').textContent),
      'Hello from a static page');
}, 'addIframe with static page config option');
