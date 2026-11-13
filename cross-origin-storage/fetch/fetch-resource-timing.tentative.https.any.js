// META: global=window,dedicatedworker
// META: script=../resources/helpers.js
// META: script=../resources/integration-helpers.js
//
// https://wicg.github.io/cross-origin-storage/#resource-timing
// https://github.com/WICG/cross-origin-storage/issues/94
// https://github.com/w3c/resource-timing/issues/439
//
// A resource that a host integration serves from COS is reported to Resource
// Timing with `deliveryType` "cross-origin-storage", `transferSize` 0, and
// `encodedBodySize` and `decodedBodySize` equal to the stored byte length.
// A miss is an ordinary network fetch and reports none of that.

'use strict';

// Resolves with the resource timing entry for `url`, which is queued once the
// response body has been fully read.
function cosResourceTimingEntry(url) {
  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      const entry = list.getEntriesByName(url)[0];
      if (entry) {
        observer.disconnect();
        resolve(entry);
      }
    });
    observer.observe({type: 'resource', buffered: true});
  });
}

promise_test(async t => {
  const content = cosUniqueContent('fetch-resource-timing-hit');
  const byteLength = new TextEncoder().encode(content).byteLength;
  await cosStore(content);
  const integrity = await cosSha256Integrity(content);
  const url = cosBrokenUrl();

  const response = await fetch(url, {integrity, crossOriginStorage: ''});
  assert_true(response.ok,
    'a fetch of a URL that 404s can only succeed if it was served from COS');
  assert_equals(await response.text(), content);

  const entry = await cosResourceTimingEntry(url);
  assert_equals(entry.deliveryType, 'cross-origin-storage',
    'a COS hit reports the "cross-origin-storage" delivery type');
  assert_equals(entry.transferSize, 0,
    'a COS hit transfers nothing over the network');
  assert_equals(entry.encodedBodySize, byteLength,
    'encodedBodySize is the size of the stored resource');
  assert_equals(entry.decodedBodySize, byteLength,
    'decodedBodySize is the size of the stored resource');
  assert_equals(entry.responseStatus, 200, 'a COS hit reports status 200');
}, 'fetch: a COS hit is reported to Resource Timing as "cross-origin-storage"');

promise_test(async t => {
  const content = cosUniqueContent('fetch-resource-timing-miss');
  const integrity = await cosSha256Integrity(content);
  const url = cosResourceUrl(content);

  const response = await fetch(url, {integrity, crossOriginStorage: ''});
  assert_true(response.ok);
  assert_equals(await response.text(), content);

  const entry = await cosResourceTimingEntry(url);
  assert_not_equals(entry.deliveryType, 'cross-origin-storage',
    'a COS miss is served from the network');
  assert_greater_than(entry.transferSize, 0,
    'a COS miss transfers the resource over the network');
}, 'fetch: a COS miss is not reported to Resource Timing as "cross-origin-storage"');
