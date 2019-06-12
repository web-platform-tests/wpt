'use strict';

// Creates a Promise test for |func| given the |description|. The |func| will be
// executed with the `periodicSync` object of an activated Service Worker
// Registration.
// |workerName| is the name of the service worker file in the service_workers
// directory to register.
function periodicSyncTest(func, description, workerName = 'sw.js') {
  promise_test(async t => {
    const serviceWorkerRegistration =
        await registerAndActivateServiceWorker(t, workerName);
    serviceWorkerRegistration.active.postMessage(null);

    assert_equals(await getMessageFromServiceWorker(), 'ready');

    return func(t, serviceWorkerRegistration.periodicSync);
  }, description);
}
