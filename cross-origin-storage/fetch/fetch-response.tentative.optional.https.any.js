// META: global=window,dedicatedworker,sharedworker
// META: script=../resources/helpers.js
// META: script=../resources/integration-helpers.js
//
// https://github.com/WICG/cross-origin-storage#fetch-integration
// https://github.com/WICG/cross-origin-storage#open-design-questions
// https://github.com/whatwg/fetch/issues/1954
//
// Optional: the spec defines no fetch() integration of its own and leaves how
// a Response served from COS reports its MIME type, status, and other
// metadata to the Fetch Standard
// (https://wicg.github.io/cross-origin-storage/#integration-with-other-specifications).
// These tests encode the explainer's proposals for whatwg/fetch#1954:
//
//   - the dictionary form of the member,
//       crossOriginStorage: {origins, contentType}
//     where the string and array forms are shorthands for `{origins}`;
//   - "Response fidelity on a cache hit": a caller-declared `contentType`,
//     applied on hits and misses alike, so both report the same Content-Type;
//   - "Header stripping": a Response served from COS cannot carry the headers
//     of a fetch that never happened.

'use strict';

const WASM_URL = '/wasm/incrementer.wasm';

promise_test(async t => {
  const content = cosUniqueContent('fetch-dict-store');
  const integrity = await cosSha256Integrity(content);

  const response = await fetch(cosResourceUrl(content), {
    integrity,
    crossOriginStorage: {origins: '*'},
  });
  assert_true(response.ok);
  assert_equals(await response.text(), content);

  assert_equals(await cosReadText(cosHash(await cosSha256Hex(content))), content,
    'the dictionary form stores the integrity-verified bytes like the string form does');
}, 'fetch, dictionary form: crossOriginStorage: {origins} stores an integrity-verified response in COS');

promise_test(async t => {
  // `{}` has no `origins` member, which matches a write that omits `origins`
  // in getFileHandle(): the same-site default.
  const content = cosUniqueContent('fetch-dict-serve');
  await cosStore(content);
  const integrity = await cosSha256Integrity(content);

  const response = await fetch(cosBrokenUrl(), {integrity, crossOriginStorage: {}});
  assert_true(response.ok, 'a fetch of a URL that 404s can only succeed if it was served from COS');
  assert_equals(await response.text(), content);
}, 'fetch, dictionary form: crossOriginStorage: {} serves a stored entry');

promise_test(async t => {
  // The declared type applies on a miss and on a hit alike, so both report
  // the same Content-Type whichever way the fetch was answered. The resource
  // is served as text/plain, so a miss that reported the network's type would
  // differ from the hit below.
  const content = cosUniqueContent('fetch-dict-content-type');
  const integrity = await cosSha256Integrity(content);
  const init = {integrity, crossOriginStorage: {contentType: 'text/x-cos-test'}};

  const miss = await fetch(cosResourceUrl(content), init);
  await miss.text();
  const hit = await fetch(cosBrokenUrl(), init);
  assert_true(hit.ok, 'the second fetch can only succeed if it was served from COS');
  await hit.text();

  assert_equals(miss.headers.get('content-type'), 'text/x-cos-test',
    'a miss reports the declared contentType');
  assert_equals(hit.headers.get('content-type'), 'text/x-cos-test',
    'a hit reports the declared contentType');
}, 'fetch, dictionary form: a declared contentType applies on a miss and on a hit alike');

promise_test(async t => {
  // Whatever answer the Content-Type question gets, a hit must answer it the
  // same way every time. A synthesized header that varied between reads of
  // one entry would be a bug under every candidate answer, and would make
  // callers that branch on the type non-deterministic.
  const content = cosUniqueContent('fetch-hit-type-stable');
  await cosStore(content, {origins: '*'});
  const integrity = await cosSha256Integrity(content);

  const first = await fetch(cosBrokenUrl(), {integrity, crossOriginStorage: '*'});
  await first.arrayBuffer();
  const second = await fetch(cosBrokenUrl(), {integrity, crossOriginStorage: '*'});
  await second.arrayBuffer();

  assert_equals(second.headers.get('content-type'), first.headers.get('content-type'),
    'repeated hits on one entry report the same Content-Type');
  assert_equals(second.status, first.status, 'repeated hits report the same status');
}, 'fetch response: repeated COS hits on one entry report a stable Content-Type and status');

promise_test(async t => {
  // A response served from COS cannot carry the headers of a fetch that never
  // happened, and the entry holds no headers to replay: the bytes are all
  // there is. Response-header names that only a real HTTP exchange can
  // produce must therefore be absent.
  const content = cosUniqueContent('fetch-hit-no-network-headers');
  await cosStore(content, {origins: '*'});
  const integrity = await cosSha256Integrity(content);
  const response = await fetch(cosBrokenUrl(), {integrity, crossOriginStorage: '*'});
  await response.arrayBuffer();

  for (const header of ['etag', 'last-modified', 'age', 'server']) {
    assert_equals(response.headers.get(header), null,
      `a COS-served response must not invent a ${header} header for a fetch that never happened`);
  }
}, 'fetch response: a COS hit does not fabricate network response headers');

promise_test(async t => {
  // The explainer's motivating example, end to end.
  //
  // WebAssembly.instantiateStreaming() refuses anything that is not
  // application/wasm. The stored bytes carry no type, so the explainer's
  // collapsed one-call form declares it with `contentType`, which applies on
  // hits and misses alike.
  const bytes = new Uint8Array(await (await fetch(WASM_URL)).arrayBuffer());
  const integrity = await cosSha256Integrity(bytes);
  const init = () => ({
    integrity,
    crossOriginStorage: {origins: '*', contentType: 'application/wasm'},
  });

  // Warm the entry from the real URL, whichever way the first call resolves.
  await WebAssembly.instantiateStreaming(fetch(WASM_URL, init()), {});

  // Now a guaranteed hit: this URL 404s, so reaching an instance at all means
  // both that COS served the bytes and that the synthesized Response, with
  // its declared type, was acceptable to instantiateStreaming().
  const {instance} = await WebAssembly.instantiateStreaming(
    fetch(cosBrokenUrl('wasm'), init()), {});
  assert_equals(instance.exports.increment(1), 2,
    'the module instantiated from a COS-served Response actually runs');
}, 'fetch response: WebAssembly.instantiateStreaming() accepts a COS-served response with a declared contentType');
