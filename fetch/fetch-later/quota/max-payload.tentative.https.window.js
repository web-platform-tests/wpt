// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/fetch/fetch-later/resources/fetch-later-helper.js
// META: script=/fetch/fetch-later/quota/resources/helper.js
'use strict';

const {HTTPS_ORIGIN, HTTPS_NOTSAMESITE_ORIGIN} = get_host_info();
const MAX_REQUEST_BODY_SIZE = QUOTA_PER_ORIGIN;

for (const dataType in BeaconDataType) {
  if (dataType === BeaconDataType.FormData ||
      dataType === BeaconDataType.URLSearchParams) {
    // Skips FormData & URLSearchParams, as browser adds extra bytes to them
    // in addition to the user-provided content. It is difficult to test a
    // request right at the quota limit.
    continue;
  }

  // Important: The following tests must be synchronously executed; otherwise,
  // all of them but the first executed one will fail due to QuotaExceededError.

  // Test making a POST request with max possible payload.
  promise_test(
      async _ => await expectFetchLater({
        activateAfter: 0,
        method: 'POST',
        body: makeBeaconData(generatePayload(MAX_REQUEST_BODY_SIZE), dataType),
      }),
      `fetchLater() accepts max payload[size=${
          MAX_REQUEST_BODY_SIZE}] in a POST request body of ${dataType}.`);

  // In a same-origin iframe, test making a POST request with max possible
  // payload.
  promise_test(
      async _ => await loadFetchLaterIframe(HTTPS_ORIGIN, {
        activateAfter: 0,
        method: 'POST',
        bodyType: dataType,
        bodySize: MAX_REQUEST_BODY_SIZE,
      }),
      `fetchLater() accepts payload[size=${
          MAX_REQUEST_BODY_SIZE}] in a POST request body of ${
          dataType} in same-origin iframe.`);

  // In an allowed cross-origin iframe, test making a POST request with max
  // possible payload.
  promise_test(
      async _ => await loadFetchLaterIframe(HTTPS_NOTSAMESITE_ORIGIN, {
        activateAfter: 0,
        method: 'POST',
        bodyType: dataType,
        bodySize: MAX_REQUEST_BODY_SIZE,
        allowDeferredFetch: true,
      }),
      `fetchLater() accepts payload[size=${
          MAX_REQUEST_BODY_SIZE}] in a POST request body of ${
          dataType} in allowed cross-origin iframe.`);
}
