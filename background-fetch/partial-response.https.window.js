// META: script=/common/get-host-info.sub.js
// META: script=/service-workers/service-worker/resources/test-helpers.sub.js
// META: script=resources/utils.js
// META: variant=?valid
// META: variant=?equals-sign
// META: variant=?first-after-last
// META: variant=?last-not-before-length
// META: variant=?missing

'use strict';

// Covers 206 responses to requests without a Range header, which are checked
// with "validate a partial response".
// https://wicg.github.io/background-fetch/#background-fetch-response
// https://fetch.spec.whatwg.org/#validate-a-partial-response

// Each variant starts one background fetch, as a page might not be allowed to
// start more.
const contentRanges = {
  'valid': 'bytes 0-15/16',
  'equals-sign': 'bytes=0-15/16',
  'first-after-last': 'bytes 15-0/16',
  'last-not-before-length': 'bytes 0-15/15',
  'missing': null,
};

const variant = location.search.slice(1);
const contentRange = contentRanges[variant];

function url() {
  let pipe = 'status(206)';
  if (contentRange !== null) {
    pipe += `|header(Content-Range,${contentRange})`;
  }
  return `resources/feature-name.txt?pipe=${encodeURIComponent(pipe)}`;
}

if (variant === 'valid') {
  backgroundFetchTest(async (test, backgroundFetch) => {
    await backgroundFetch.fetch(uniqueId(), url());
    const {type, eventRegistration, results} =
        await getMessageFromServiceWorker();
    assert_equals(type, 'backgroundfetchsuccess');
    assert_equals(eventRegistration.failureReason, '');
    assert_equals(results.length, 1);
    assert_equals(results[0].status, 206);
    assert_equals(results[0].text, 'Background Fetch');
  }, `A 206 response with Content-Range "${contentRange}" succeeds`);
} else {
  const description = contentRange === null ?
      'A 206 response without Content-Range fails' :
      `A 206 response with Content-Range "${contentRange}" fails`;
  backgroundFetchTest(async (test, backgroundFetch) => {
    await backgroundFetch.fetch(uniqueId(), url());
    const {type, eventRegistration, results} =
        await getMessageFromServiceWorker();
    assert_equals(type, 'backgroundfetchfail');
    assert_equals(eventRegistration.failureReason, 'fetch-error');
    assert_array_equals(results, [null]);
  }, description);
}
