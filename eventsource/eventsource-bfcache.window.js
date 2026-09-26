// META: title=Testing BFCache support for pages with open EventSource connections.
// META: timeout=long
// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/utils.js
// META: script=/html/browsers/browsing-the-web/back-forward-cache/resources/rc-helper.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js

async function getConnectionCount(key) {
  const response = await fetch(
      `/eventsource/resources/bfcache-counter.py?token=${key}&query=1`,
      { cache: 'no-store' });
  const result = await response.json();
  return result.count;
}

async function waitForConnectionCount(key, expectedCount) {
  const TIMEOUT_MS = 3000;
  const INTERVAL_MS = 100;
  const deadline = performance.now() + TIMEOUT_MS;
  while (performance.now() <= deadline) {
    const count = await getConnectionCount(key);
    if (count === expectedCount) {
      return;
    }
    await new Promise(resolve => step_timeout(resolve, INTERVAL_MS));
  }
  assert_equals(
      await getConnectionCount(key), expectedCount,
      `Expected ${expectedCount} open EventSource connections.`);
}

promise_test(async () => {
  const rcHelper = new RemoteContextHelper();
  const key = token();

  const page = await rcHelper.addWindow(null, { features: 'noopener '});

  await page.executeScript(async (key) => {
    const url =
        `/eventsource/resources/bfcache-counter.py?token=${key}`;
    const eventSource = new EventSource(url);
    await new Promise((resolve, reject) => {
      eventSource.onopen = () => resolve();
      eventSource.onerror =
          () => reject(new Error('EventSource failed to open.'));
    });
  }, [key]);

  await waitForConnectionCount(key, 1);

  await prepareForBFCache(page);
  const activePage = await page.navigateToNew();

  // When the page enters BFCache its EventSource connection must be closed.
  await waitForConnectionCount(key, 0);

  await activePage.historyBack();
  await assertImplementsBFCacheOptional(page);
  await waitForConnectionCount(key, 1);
}, 'EventSource should close when a page enters BFCache and reconnect when restored.');
