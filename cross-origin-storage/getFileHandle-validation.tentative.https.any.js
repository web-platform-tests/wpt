// META: global=window,dedicatedworker,sharedworker
// META: script=resources/helpers.js
//
// Tests "validate a COS request" (the synchronous-ish rejection checks that
// run before any registry lookup, fetch, or write):
// https://wicg.github.io/cross-origin-storage/#validate-a-cos-request

'use strict';

promise_test(async t => {
  const hash = cosHash('a'.repeat(64), 'md5');
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(hash));
}, 'getFileHandle() rejects with TypeError for an algorithm not recognized by the Web Crypto API');

promise_test(async t => {
  const hash = cosHash('a'.repeat(64), 'not-a-real-algorithm');
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(hash, {create: true}));
}, 'getFileHandle({create:true}) rejects with TypeError for an unrecognized algorithm');

promise_test(async t => {
  // Too short.
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(cosHash('a'.repeat(63))));
}, 'getFileHandle() rejects with TypeError for a SHA-256 value shorter than 64 hex digits');

promise_test(async t => {
  // Too long.
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(cosHash('a'.repeat(65))));
}, 'getFileHandle() rejects with TypeError for a SHA-256 value longer than 64 hex digits');

promise_test(async t => {
  // Uppercase is not accepted; the value must be lowercase hex.
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(cosHash('A'.repeat(64))));
}, 'getFileHandle() rejects with TypeError for an uppercase hash value');

promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(cosHash('not-hexadecimal-'.repeat(4))));
}, 'getFileHandle() rejects with TypeError for a non-hexadecimal hash value');

promise_test(async t => {
  const hash = cosMissingHash();
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(hash, {create: true, origins: 'not a url'}));
}, 'getFileHandle({create:true}) rejects with TypeError when origins is a single string that does not parse as a URL');

promise_test(async t => {
  const hash = cosMissingHash();
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(
      hash, {create: true, origins: ['https://valid.example', 'not a url']}));
}, 'getFileHandle({create:true}) rejects with TypeError when any entry in an origins list does not parse as a URL');

promise_test(async t => {
  const hash = cosMissingHash();
  // data: URLs parse to an opaque origin.
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(
      hash, {create: true, origins: ['data:text/plain,hi']}));
}, 'getFileHandle({create:true}) rejects with TypeError when an origins entry parses to an opaque origin');

// A named origin must parse to an `http:` or `https:` URL whose origin is
// potentially trustworthy, since only such an origin could ever call
// getFileHandle() itself.
for (const [origin, reason] of [
  ['http://example.com', 'an http: origin on a non-loopback host'],
  ['ws://localhost', 'a ws: origin, even on a loopback host'],
  ['wss://example.com', 'a wss: origin, even though its origin is potentially trustworthy'],
  ['ftp://example.com', 'an ftp: origin'],
  ['blob:https://example.com/0b9e1f1c-2f51-4c48-9d6c-6c1d3f5e8a77',
   'a blob: URL, even though its origin is a potentially trustworthy https: origin'],
  ['chrome-extension://abcdefghijklmnopabcdefghijklmnop', 'a chrome-extension: origin'],
  ['moz-extension://0b9e1f1c-2f51-4c48-9d6c-6c1d3f5e8a77', 'a moz-extension: origin'],
  ['safari-web-extension://0B9E1F1C-2F51-4C48-9D6C-6C1D3F5E8A77',
   'a safari-web-extension: origin'],
  ['file:///etc/hosts', 'a file: URL'],
]) {
  promise_test(async t => {
    const hash = cosMissingHash();
    await promise_rejects_js(t, TypeError,
      navigator.crossOriginStorage.getFileHandle(
        hash, {create: true, origins: ['https://valid.example', origin]}));
  }, `getFileHandle({create:true}) rejects with TypeError when an origins entry is ${reason}`);
}

for (const origin of [
  'http://localhost',
  'http://localhost:8000',
  'http://app.localhost',
  'http://127.0.0.1:8000',
  'http://127.1.2.3',
  'http://[::1]',
  'https://localhost',
]) {
  promise_test(async t => {
    // A loopback origin is potentially trustworthy, so it passes validation.
    // This covers the "localhost" name, its subdomains, all of 127.0.0.0/8,
    // and ::1. Requesting the handle without writing to it leaves no entry.
    const handle = await navigator.crossOriginStorage.getFileHandle(
      cosMissingHash(), {create: true, origins: [origin]});
    assert_true(handle instanceof FileSystemFileHandle);
  }, `getFileHandle({create:true}) accepts the loopback http: origin ${origin}`);
}

promise_test(async t => {
  const hash = cosMissingHash();
  // The "maximum origins list length" is implementation-defined, a positive
  // integer with no normative upper bound, so this test assumes a value. The
  // assumption follows the guidance in
  // https://wicg.github.io/cross-origin-storage/#cross-site-probing: the
  // limit fits "a handful of related origins under common control" and stays
  // far short of any approximation of every origin. A list of 100,000
  // origins is well past that by any reading.
  const origins = Array.from({length: 100000}, (_, i) => `https://origin-${i}.example`);
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(hash, {create: true, origins}));
}, 'getFileHandle({create:true}) rejects with TypeError when the origins list exceeds the implementation-defined maximum length');

promise_test(async t => {
  // A validation failure must not create a registry entry: a subsequent read
  // for the same hash must behave exactly as if the call had never been made.
  // No create request registers anything in any case, so this holds for the
  // same reason a well-formed but unfinished create request leaves no trace.
  const hash = cosMissingHash();
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(hash, {create: true, origins: 'not a url'}));
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.getFileHandle(hash));
}, 'A validation failure on a create request does not create a registry entry');

promise_test(async t => {
  // Sanity check: a well-formed, differently-cased algorithm name is
  // accepted (case-insensitive match against "SHA-256").
  const content = cosUniqueContent('validation-case-insensitive-algorithm');
  const value = await cosSha256Hex(content);
  const handle = await navigator.crossOriginStorage.getFileHandle(
    cosHash(value, 'sha-256'), {create: true});
  const writable = await handle.createWritable();
  await writable.write(new Blob([content]));
  await writable.close();
  const text = await cosReadText(cosHash(value, 'SHA-256'));
  assert_equals(text, content);
}, 'getFileHandle() accepts an algorithm name that differs only in case from "SHA-256"');

// "validate a COS request" checks `origins` whenever the member exists, and
// `getFileHandle()` runs it before branching on `create`. A read request that
// names a malformed origin is therefore rejected as malformed, and never
// reaches the registry lookup that would answer NotFoundError.
// https://wicg.github.io/cross-origin-storage/#getfilehandle
promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(cosMissingHash(), {origins: 'not a url'}));
}, 'getFileHandle() without create rejects with TypeError when origins does not parse as a URL');

promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(
      cosMissingHash(), {origins: ['http://example.com']}));
}, 'getFileHandle() without create rejects with TypeError when an origins entry is not potentially trustworthy');

promise_test(async t => {
  // A well-formed origins value on a read request passes validation, and the
  // read then answers for the hash alone.
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.getFileHandle(cosMissingHash(), {origins: '*'}));
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.getFileHandle(
      cosMissingHash(), {origins: ['https://valid.example']}));
}, 'getFileHandle() without create accepts a well-formed origins value and answers NotFoundError for a missing hash');

// "*" is exempt from origin parsing only as the whole `origins` value. As an
// item of a list it is a candidate like any other, and it does not parse as a
// URL.
promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(
      cosMissingHash(), {create: true, origins: ['*']}));
}, 'getFileHandle({create:true}) rejects with TypeError when origins is a list containing "*"');

promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(
      cosMissingHash(), {create: true, origins: ['https://valid.example', '*']}));
}, 'getFileHandle({create:true}) rejects with TypeError when "*" appears among listed origins');

promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(cosMissingHash(), {origins: ['*']}));
}, 'getFileHandle() without create rejects with TypeError when origins is a list containing "*"');

promise_test(async t => {
  const handle = await navigator.crossOriginStorage.getFileHandle(
    cosMissingHash(), {create: true, origins: '*'});
  assert_true(handle instanceof FileSystemFileHandle);
}, 'getFileHandle({create:true}) accepts origins: "*"');

promise_test(async t => {
  // An explicit empty list requests what omitting origins requests.
  // https://wicg.github.io/cross-origin-storage/#cos-entries
  const handle = await navigator.crossOriginStorage.getFileHandle(
    cosMissingHash(), {create: true, origins: []});
  assert_true(handle instanceof FileSystemFileHandle);
}, 'getFileHandle({create:true}) accepts an empty origins list');

promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle(
      cosMissingHash(), {create: true, origins: ''}));
}, 'getFileHandle({create:true}) rejects with TypeError when origins is the empty string');

promise_test(async t => {
  // A candidate is run through the basic URL parser and only its origin is
  // kept, so a path, a query, or a fragment does not make it invalid.
  const handle = await navigator.crossOriginStorage.getFileHandle(
    cosMissingHash(),
    {create: true, origins: ['https://valid.example/some/path?query=1#fragment']});
  assert_true(handle instanceof FileSystemFileHandle);
}, 'getFileHandle({create:true}) accepts an origins entry with a path, a query, and a fragment');

// The algorithm has to name a *hash* algorithm recognized by the Web
// Cryptography API. Names the API recognizes for other operations do not
// qualify.
for (const algorithm of ['AES-GCM', 'HMAC', 'ECDSA', 'Ed25519', 'PBKDF2']) {
  promise_test(async t => {
    await promise_rejects_js(t, TypeError,
      navigator.crossOriginStorage.getFileHandle(cosHash('a'.repeat(64), algorithm)));
  }, `getFileHandle() rejects with TypeError for ${algorithm}, which is not a hash algorithm`);
}

// Hex-encodes the digest of `content` under `algorithm`.
async function digestHex(algorithm, content) {
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(content));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// "SHA-1" is excluded because it is not collision resistant, even though the
// Web Cryptography API recognizes it.
for (const algorithm of ['SHA-1', 'sha-1']) {
  promise_test(async t => {
    const value = 'a'.repeat(40);
    await promise_rejects_js(t, TypeError,
      navigator.crossOriginStorage.getFileHandle(cosHash(value, algorithm)));
    await promise_rejects_js(t, TypeError,
      navigator.crossOriginStorage.getFileHandle(cosHash(value, algorithm), {create: true}));
  }, `getFileHandle() rejects with TypeError for the excluded algorithm "${algorithm}"`);
}

// The 64-hex-digit format check applies only to "SHA-256". Every other
// admitted hash algorithm passes validation with its own digest length, so a
// read for a missing hash answers NotFoundError.
for (const [algorithm, length] of [['SHA-384', 96], ['SHA-512', 128]]) {
  promise_test(async t => {
    const bytes = new Uint8Array(length / 2);
    crypto.getRandomValues(bytes);
    const value = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    await promise_rejects_dom(t, 'NotFoundError',
      navigator.crossOriginStorage.getFileHandle(cosHash(value, algorithm)));
  }, `getFileHandle() accepts a ${length}-hex-digit ${algorithm} value and answers NotFoundError for a missing hash`);
}

for (const algorithm of ['SHA-384', 'SHA-512']) {
  promise_test(async t => {
    // "verify and store" hashes the written bytes with the algorithm the
    // handle's hash names, so a non-SHA-256 entry stores and reads back.
    const content = cosUniqueContent(`validation-roundtrip-${algorithm}`);
    const hash = cosHash(await digestHex(algorithm, content), algorithm);
    const handle = await navigator.crossOriginStorage.getFileHandle(hash, {create: true});
    const writable = await handle.createWritable();
    await writable.write(new Blob([content]));
    await writable.close();
    assert_equals(await cosReadText(hash), content);
  }, `a ${algorithm} entry roundtrips through getFileHandle()`);
}

// Both members of CrossOriginStorageGetFileHandleHash are `required`, so
// Web IDL dictionary conversion throws before the method steps run.
promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle({algorithm: 'SHA-256'}));
}, 'getFileHandle() rejects with TypeError when the hash has no value');

promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.getFileHandle({value: 'a'.repeat(64)}));
}, 'getFileHandle() rejects with TypeError when the hash has no algorithm');

promise_test(async t => {
  await promise_rejects_js(t, TypeError, navigator.crossOriginStorage.getFileHandle());
}, 'getFileHandle() rejects with TypeError when called without a hash');
