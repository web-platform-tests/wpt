// META: global=window,worker
// META: script=resources/helpers.js
//
// Tests "validate a COS request" (the synchronous-ish rejection checks that
// run before any registry lookup, fetch, or write):
// https://wicg.github.io/cross-origin-storage/#validate-a-cos-request

'use strict';

promise_test(async t => {
  const hash = cosHash('a'.repeat(64), 'md5');
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(hash));
}, 'requestFileHandle() rejects with TypeError for an algorithm not recognized by the Web Crypto API');

promise_test(async t => {
  const hash = cosHash('a'.repeat(64), 'not-a-real-algorithm');
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(hash, {create: true}));
}, 'requestFileHandle({create:true}) rejects with TypeError for an unrecognized algorithm');

promise_test(async t => {
  // Too short.
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(cosHash('a'.repeat(63))));
}, 'requestFileHandle() rejects with TypeError for a SHA-256 value shorter than 64 hex digits');

promise_test(async t => {
  // Too long.
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(cosHash('a'.repeat(65))));
}, 'requestFileHandle() rejects with TypeError for a SHA-256 value longer than 64 hex digits');

promise_test(async t => {
  // Uppercase is not accepted; the value must be lowercase hex.
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(cosHash('A'.repeat(64))));
}, 'requestFileHandle() rejects with TypeError for an uppercase hash value');

promise_test(async t => {
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(cosHash('not-hexadecimal-'.repeat(4))));
}, 'requestFileHandle() rejects with TypeError for a non-hexadecimal hash value');

promise_test(async t => {
  const hash = cosMissingHash();
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(hash, {create: true, origins: 'not a url'}));
}, 'requestFileHandle({create:true}) rejects with TypeError when origins is a single string that does not parse as a URL');

promise_test(async t => {
  const hash = cosMissingHash();
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(
      hash, {create: true, origins: ['https://valid.example', 'not a url']}));
}, 'requestFileHandle({create:true}) rejects with TypeError when any entry in an origins list does not parse as a URL');

promise_test(async t => {
  const hash = cosMissingHash();
  // data: URLs parse to an opaque origin.
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(
      hash, {create: true, origins: ['data:text/plain,hi']}));
}, 'requestFileHandle({create:true}) rejects with TypeError when an origins entry parses to an opaque origin');

promise_test(async t => {
  const hash = cosMissingHash();
  // No implementation is expected to support anywhere near this many
  // explicitly-listed origins; this exceeds any plausible
  // implementation-defined "maximum origins list length".
  const origins = Array.from({length: 1000}, (_, i) => `https://origin-${i}.example`);
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(hash, {create: true, origins}));
}, 'requestFileHandle({create:true}) rejects with TypeError when the origins list exceeds the implementation-defined maximum length');

promise_test(async t => {
  // A validation failure must not create a pending (or any) registry entry:
  // a subsequent read for the same hash must behave exactly as if the call
  // had never been made.
  const hash = cosMissingHash();
  await promise_rejects_js(t, TypeError,
    navigator.crossOriginStorage.requestFileHandle(hash, {create: true, origins: 'not a url'}));
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.requestFileHandle(hash));
}, 'A validation failure on a create request does not create a registry entry');

promise_test(async t => {
  // Sanity check: a well-formed, differently-cased algorithm name is
  // accepted (case-insensitive match against "SHA-256").
  const content = cosUniqueContent('validation-case-insensitive-algorithm');
  const value = await cosSha256Hex(content);
  const handle = await navigator.crossOriginStorage.requestFileHandle(
    cosHash(value, 'sha-256'), {create: true});
  const writable = await handle.createWritable();
  await writable.write(new Blob([content]));
  await writable.close();
  const text = await cosReadText(cosHash(value, 'SHA-256'));
  assert_equals(text, content);
}, 'requestFileHandle() accepts an algorithm name that differs only in case from "SHA-256"');
