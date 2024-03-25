// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/fetch/fetch-later/resources/fetch-later-helper.js
// META: script=/fetch/fetch-later/quota/resources/helper.js
'use strict';

const {HTTPS_ORIGIN} = get_host_info();

for (const dataType in BeaconDataType) {
  // Tests that a reporting origin only allow queuing POST requests within its
  // quota.
  test(
      () => {
        const controller = new AbortController();

        // Makes the 1st call (POST) that sends max/2+1 quota.
        fetchLater(`${HTTPS_ORIGIN}/`, {
          method: 'POST',
          signal: controller.signal,
          body: makeBeaconData(
              generatePayload(QUOTA_PER_ORIGIN / 2 + 1), dataType)
        });

        // Makes the 2nd call (POST) to the same reporting origin that sends
        // max/2+1 bytes, which should be rejected.
        assert_throws_dom('QuotaExceededError', () => {
          fetchLater(`${HTTPS_ORIGIN}/`, {
            method: 'POST',
            signal: controller.signal,
            body: makeBeaconData(
                generatePayload(QUOTA_PER_ORIGIN / 2 + 1), dataType)
          });
        });

        // Makes the 3rd call (GET) to the same reporting origin, which should
        // be accepted.
        fetchLater(`${HTTPS_ORIGIN}/`, {
          method: 'GET',
          signal: controller.signal,
        });

        // Release quota taken by the pending requests for subsequent tests.
        controller.abort();
      },
      `The 2nd fetchLater(same-origin) call in the top-level document is not allowed to exceed per-origin quota for its POST body of ${
          dataType}.`);

  // Tests that a reporting origin's quota is shared across same-origin frames.
  promise_test(
      async _ => {
        const controller = new AbortController();

        // Makes the 1st call (POST) that sends max/2+1 quota.
        fetchLater(`${HTTPS_ORIGIN}/`, {
          method: 'POST',
          signal: controller.signal,
          body: makeBeaconData(
              generatePayload(QUOTA_PER_ORIGIN / 2 + 1), dataType)
        });

        // In a same-origin iframe, makes the 2nd call (POST) to the same
        // reporting origin that sends max/2+1 bytes, which should be rejected.
        await loadFetchLaterIframe(HTTPS_ORIGIN, {
          targetUrl: `${HTTPS_ORIGIN}/`,
          activateAfter: 0,
          method: 'POST',
          bodyType: dataType,
          bodySize: QUOTA_PER_ORIGIN / 2 + 1,
          expect: new FetchLaterIframeExpectation(
              FetchLaterExpectationType.ERROR_DOM, 'QuotaExceededError'),
        });

        // Release quota taken by the pending requests for subsequent tests.
        controller.abort();
      },
      `The 2nd fetchLater(same-origin) call in a same-origin child iframe is not allowed to exceed per-origin quota for its POST body of ${
          dataType}.`);
}
