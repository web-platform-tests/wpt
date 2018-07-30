// META: script=/service-workers/service-worker/resources/test-helpers.sub.js
// META: script=resources/utils.js
'use strict';

// Covers basic functionality provided by BackgroundFetchSettledEvent methods.
// https://wicg.github.io/background-fetch/#backgroundfetchsettledevent

backgroundFetchTest(async (test, backgroundFetch) => {
    const registrationId = uniqueId();
    const registration = await backgroundFetch.fetch(
        registrationId, ['resources/feature-name.txt', 'resources/types_of_cheese.txt']);

    const settled_fetch = await getMessageFromServiceWorker();
    assert_true(settled_fetch.url.includes('resources/feature-name.txt'));
    assert_equals(settled_fetch.status, 200);
    assert_equals(settled_fetch.text, 'Background Fetch');

  }, 'Using Background Fetch to successfully call match() on BackgroundFetchSettledEvent',
     'resources/sw_backgroundfetched_match.js');