// META: global=window,dedicatedworker,sharedworker
// META: script=../resources/helpers.js
// META: script=../resources/integration-helpers.js
//
// https://github.com/WICG/cross-origin-storage#open-design-questions
// https://github.com/whatwg/fetch/issues/1954
// https://wicg.github.io/cross-origin-storage/#integration-with-other-specifications
//
// What a Response synthesized from a COS hit looks like. This is the part of
// the fetch integration the three declarative forms never have to answer: an
// element, a module type, or a CSS property fixes the destination, and a bare
// fetch() has none. A COS entry stores bytes only, with no MIME type, status,
// or headers, because unverifiable metadata cannot be attributed to a hash.
// The spec leaves how such a Response reports its metadata to whatwg/fetch#1954.
//
// This file asserts what every candidate answer agrees on: a hit delivers the
// exact stored bytes, the response is usable (ok, a success status), and its
// body can be read incrementally. The explainer's open questions (the
// Content-Type of a hit, and which headers it carries) are covered in
// fetch-response.tentative.optional.https.any.js.

'use strict';

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
  // The reason the integration exists at all: the hand-written miss path is
  // ~30 lines of tee()/pipeTo() to keep download and consumption overlapping.
  // Whether an integrity-checked fetch can resolve before its body is complete
  // is open in general. Every Response body is a ReadableStream, so the check
  // below only pins down that a hit's body is readable chunk by chunk and
  // yields the stored bytes; it cannot show whether the user agent buffered
  // them first.
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
