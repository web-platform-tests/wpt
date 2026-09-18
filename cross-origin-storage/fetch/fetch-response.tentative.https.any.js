// META: global=window,worker
// META: script=../resources/helpers.js
//
// https://wicg.github.io/cross-origin-storage/README.md#open-design-questions
// https://github.com/whatwg/fetch/issues/1954
//
// What a Response synthesized from a COS hit looks like. This is the part of
// the fetch integration the three declarative forms never have to answer: an
// element, a module type, or a CSS property fixes the destination, whereas a
// bare fetch() has none, and a COS entry stores bytes only -- no MIME type,
// no status, no headers, deliberately, because unverifiable metadata cannot
// be attributed to a hash.
//
// The explainer records two open questions here, so this file is careful
// about which of its assertions are settled and which encode a candidate
// answer:
//
//   Settled, and asserted outright: a hit delivers the exact stored bytes,
//     the response is usable (ok, a success status), and its body is a
//     ReadableStream that can be consumed incrementally.
//   Open, and marked at each site: what Content-Type a hit reports. The
//     wasm test below encodes the third candidate answer from the explainer,
//     "store a user-agent-computed type alongside the bytes", because that is
//     the only one under which the integration's own motivating example
//     works. Revisit when whatwg/fetch#1954 settles.

'use strict';

const WASM_URL = '/wasm/incrementer.wasm';

function cosEchoUrl(content) {
  return new URL(
    `/common/echo.py?content=${encodeURIComponent(content)}`, location.href).href;
}

function cosBrokenUrl(extension = 'txt') {
  return new URL(`./does-not-exist-${Math.random()}.${extension}`, location.href).href;
}

// Stores `content` imperatively and returns a Response served from that
// entry, fetched from a URL that 404s so the bytes cannot have come from the
// network.
async function cosHitResponse(content, scope = '*') {
  await cosStore(content, scope ? {origins: scope} : {});
  const integrity = await cosSha256Integrity(content);
  return fetch(cosBrokenUrl(), {integrity, crossOriginStorage: scope});
}

promise_test(async t => {
  const content = cosUniqueContent('fetch-hit-bytes');
  const response = await cosHitResponse(content);

  assert_true(response.ok, 'a COS-served response is a successful response');
  assert_greater_than_equal(response.status, 200);
  assert_less_than(response.status, 300,
    'the exact status is an open question, but a hit must report a success status ' +
    'or every caller that checks response.ok breaks');

  const bytes = new Uint8Array(await response.arrayBuffer());
  const expected = new TextEncoder().encode(content);
  assert_array_equals(Array.from(bytes), Array.from(expected),
    'a hit delivers the stored bytes exactly, byte for byte');
}, 'fetch response: a COS hit is a successful response carrying the stored bytes');

promise_test(async t => {
  // The explainer's fourth open question, and the reason the integration
  // exists at all: the hand-written miss path is ~30 lines of tee()/pipeTo()
  // precisely to keep download and consumption overlapping. Fetch currently
  // fully reads a response body before handing it over whenever integrity
  // metadata is non-empty, so whether an integrity-checked fetch can resolve
  // before its body is complete is open in general -- but a hit is the case
  // where it can, since the bytes were hash-verified when they were written
  // and need no re-verification. What is testable here is the shape that
  // makes streaming possible at all: the body arrives as a stream, not as an
  // already-buffered blob.
  const content = cosUniqueContent('fetch-hit-stream');
  const response = await cosHitResponse(content);

  assert_true(response.body instanceof ReadableStream,
    'a COS-served response exposes a ReadableStream body');

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  assert_array_equals(Array.from(joined), Array.from(new TextEncoder().encode(content)),
    'reading the stream incrementally yields the stored bytes');
}, 'fetch response: a COS hit delivers its body as a readable stream');

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
  // produce must therefore be absent rather than invented.
  const content = cosUniqueContent('fetch-hit-no-network-headers');
  const response = await cosHitResponse(content);
  await response.arrayBuffer();

  for (const header of ['etag', 'last-modified', 'age', 'server']) {
    assert_equals(response.headers.get(header), null,
      `a COS-served response must not invent a ${header} header for a fetch that never happened`);
  }
}, 'fetch response: a COS hit does not fabricate network response headers');

promise_test(async t => {
  // The motivating example from the explainer, end to end.
  //
  // WebAssembly.instantiateStreaming() refuses anything that is not
  // application/wasm, which is exactly why the hand-written cache-miss path
  // has to construct `new Response(stream, {headers: {'Content-Type':
  // 'application/wasm'}})` itself. For the collapsed one-call form to work,
  // a hit has to report a usable type, so this test encodes the explainer's
  // third candidate answer to the open Content-Type question. If
  // whatwg/fetch#1954 settles on deriving the type from the request's
  // destination instead, a bare fetch() has no destination to derive from and
  // this test is what will say so.
  const bytes = new Uint8Array(await (await fetch(WASM_URL)).arrayBuffer());
  const integrity = await cosSha256Integrity(bytes);
  const init = () => ({integrity, crossOriginStorage: '*'});

  // Warm the entry from the real URL, whichever way the first call resolves.
  await WebAssembly.instantiateStreaming(fetch(WASM_URL, init()), {});

  // Now a guaranteed hit: this URL 404s, so reaching an instance at all means
  // both that COS served the bytes and that the synthesized Response was
  // acceptable to instantiateStreaming().
  const {instance} = await WebAssembly.instantiateStreaming(
    fetch(cosBrokenUrl('wasm'), init()), {});
  assert_equals(instance.exports.increment(1), 2,
    'the module instantiated from a COS-served Response actually runs');
}, 'fetch response: WebAssembly.instantiateStreaming() accepts a COS-served response');
