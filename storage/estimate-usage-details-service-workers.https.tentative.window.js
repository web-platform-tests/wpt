// META: title=StorageManager: estimate() for service worker registrations

promise_test(async t => {
  let estimate = await navigator.storage.estimate();

  const usageBeforeCreate = estimate.usageDetails.serviceWorkerRegistrations ||
      0;

  // Note: helpers.js is an arbitrary file; it could be any file that
  // exists, but this test does not depend on the contents of said file.
  const serviceWorkerRegistration = await
      navigator.serviceWorker.register('./helpers.js');
  t.add_cleanup(() => serviceWorkerRegistration.unregister());

  estimate = await navigator.storage.estimate();
  assert_true('serviceWorkerRegistrations' in estimate.usageDetails);
  const usageAfterCreate = estimate.usageDetails.serviceWorkerRegistrations;

  assert_greater_than(
      usageAfterCreate, usageBeforeCreate,
      'estimated usage should increase after service worker is registered');
}, 'estimate() shows usage increase after large value is stored');
