// META: script=/common/get-host-info.sub.js
// META: script=/common/utils.js
// META: script=/fetch/fetch-later/resources/fetch-later-helper.js
'use strict';

const {HTTPS_ORIGIN, HTTPS_NOTSAMESITE_ORIGIN} = get_host_info();
const SMALL_REQUEST_BODY_SIZE = 20;

for (const dataType in BeaconDataType) {
  // Test making a POST request with small payload.
  parallelPromiseTest(
      async _ => expectFetchLater({
        activateAfter: 0,
        method: 'POST',
        body:
            makeBeaconData(generatePayload(SMALL_REQUEST_BODY_SIZE), dataType),
      }),
      `fetchLater() accepts small payload in a POST request body of ${
          dataType}.`);

  // In a same-origin iframe, test making a POST request with small payload.
  parallelPromiseTest(
      async _ => await loadFetchLaterIframe(HTTPS_ORIGIN, {
        activateAfter: 0,
        method: 'POST',
        bodyType: dataType,
        bodySize: SMALL_REQUEST_BODY_SIZE,
      }),
      `fetchLater() accepts payload[size=${
          SMALL_REQUEST_BODY_SIZE}] in a POST request body of ${
          dataType} in same-origin iframe.`);

  // In an allowed cross-origin iframe, test making a POST request with small
  // payload.
  parallelPromiseTest(
      async _ => await loadFetchLaterIframe(HTTPS_NOTSAMESITE_ORIGIN, {
        activateAfter: 0,
        method: 'POST',
        bodyType: dataType,
        bodySize: SMALL_REQUEST_BODY_SIZE,
        allowDeferredFetch: true,
      }),
      `fetchLater() accepts payload[size=${
          SMALL_REQUEST_BODY_SIZE}] in a POST request body of ${
          dataType} in an allowed cross-origin iframe.`);
}
