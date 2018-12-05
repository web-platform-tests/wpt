self.GLOBAL = {
  isWindow: function() { return false; },
  isWorker: function() { return true; },
};
importScripts("/resources/testharness.js");

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await cookieStore.subscribeToChanges([
      { name: 'cookie-name', matchType: 'equals', url: '/scope/path' }]);
  })());
});

// Resolves when the service worker receives the 'activate' event.
const kServiceWorkerActivatedPromise = new Promise(resolve => {
  self.addEventListener('activate', event => { resolve(); });
});

promise_test(async testCase => {
  await kServiceWorkerActivatedPromise;

  const cookie_change_received_promise = new Promise((resolve) => {
    self.addEventListener('cookiechange', (event) => {
      resolve(event);
    });
  });

  await cookieStore.set('another-cookie-name', 'cookie-value');
  testCase.add_cleanup(() => cookieStore.delete('another-cookie-name'));
  await cookieStore.set('cookie-name', 'cookie-value');
  testCase.add_cleanup(() => cookieStore.delete('cookie-name'));

  const event = await cookie_change_received_promise;
  assert_equals(event.type, 'cookiechange');
  assert_equals(event.changed.length, 1);
  assert_equals(event.changed[0].name, 'cookie-name');
  assert_equals(event.changed[0].value, 'cookie-value');
}, 'cookiechange not dispatched for change that does not match subscription');

done();
