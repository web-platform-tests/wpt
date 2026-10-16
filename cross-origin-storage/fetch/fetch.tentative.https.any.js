// META: global=window,dedicatedworker,sharedworker
// META: script=../resources/helpers.js
// META: script=../resources/integration-helpers.js
//
// https://github.com/WICG/cross-origin-storage#fetch-integration
// https://github.com/whatwg/fetch/issues/1954
// https://wicg.github.io/cross-origin-storage/#storing-fetched-resources
//
// A `crossOriginStorage` member on RequestInit, used alongside the existing
// `integrity` option, opts an imperative fetch() into COS. The explainer
// proposes:
//
//   dictionary CrossOriginStorageRequestOptions {
//     (DOMString or sequence<DOMString>) origins;
//     DOMString contentType;
//   };
//
//   partial dictionary RequestInit {
//     (DOMString or sequence<DOMString> or CrossOriginStorageRequestOptions)
//         crossOriginStorage;
//   };
//
// The string and array forms are shorthands for `{origins}`, and they are what
// this file covers; the dictionary form is exercised in
// fetch-response.tentative.optional.https.any.js.
//
// The member's *presence* is the opt-in and its *value* is the scope, which
// is why same-site is spelled "" and an omitted member means no COS at all:
// fetch() has no `create: true` to carry the opt-in separately. "" is
// same-site, "*" is global, and an array restricts the entry to those origins.
// The list form is a sequence here, matching the imperative `origins` option
// down to the IDL type; the HTML and import-attribute forms use a
// space-separated string.
//
// Two directions are worth proving separately, and this file does both for
// each scope spelling:
//
//   miss -> store: fetch a real URL whose bytes are unique to this run, then
//     read the same hash back through getFileHandle(). Only the
//     integration's store-on-miss step can have put it there.
//   hit -> serve: store bytes imperatively, then fetch a URL that 404s while
//     declaring their hash. Without COS an integrity-checked 404 is a network
//     error, so a successful read is only explicable as a COS hit.
//
// This file runs in dedicated and shared workers as well as a window, which is
// what covers the integration in workers. A service worker is covered by
// fetch-service-worker.tentative.https.html: its owner set is empty, so
// "check Cross-Origin Storage permission" returns false there and the store
// step stores nothing.

'use strict';

// A same-origin URL that serves exactly `content`, so each test can mint
// bytes nothing has ever stored before. COS persists across runs and its
// entries are keyed by hash, so a fixed fixture would already be present on
// the second run and "miss -> store" would silently stop testing the miss.
function cosEchoUrl(content) {
  return cosResourceUrl(content);
}

// Syntactically valid SRI metadata (32 zero bytes) that no real content
// matches.
const COS_WRONG_INTEGRITY =
  'sha256-' + btoa(String.fromCharCode(...new Uint8Array(32)));

async function assertNotInCOS(t, content, description) {
  const hash = cosHash(await cosSha256Hex(content));
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.getFileHandle(hash), description);
}

// Both directions, once per string-valued scope spelling. The array form is
// covered separately below, since only its spelling differs.
for (const [label, scope] of [
  ['"" (same-site)', ''],
  ['"*" (global)', '*'],
]) {
  promise_test(async t => {
    const content = cosUniqueContent(`fetch-store-${scope || 'samesite'}`);
    const integrity = await cosSha256Integrity(content);

    const response = await fetch(cosEchoUrl(content), {
      integrity,
      crossOriginStorage: scope,
    });
    assert_true(response.ok, 'the network fetch itself succeeded');
    assert_equals(await response.text(), content, 'the response body is the fetched bytes');

    assert_equals(await cosReadText(cosHash(await cosSha256Hex(content))), content,
      'the fetched, integrity-verified bytes were stored in COS under their hash');
  }, `fetch: crossOriginStorage: ${label} stores an integrity-verified response in COS`);

  promise_test(async t => {
    const content = cosUniqueContent(`fetch-serve-${scope || 'samesite'}`);
    await cosStore(content, scope ? {origins: scope} : {});
    const integrity = await cosSha256Integrity(content);

    const response = await fetch(cosBrokenUrl(), {integrity, crossOriginStorage: scope});
    assert_true(response.ok,
      'a fetch of a URL that 404s can only succeed if it was served from COS');
    assert_equals(await response.text(), content,
      'the COS-served response carries the stored bytes');
  }, `fetch: crossOriginStorage: ${label} serves a stored entry without a network request`);
}

promise_test(async t => {
  // The list form here is a sequence<DOMString>; the HTML attribute and the
  // import attribute take space-separated strings.
  const content = cosUniqueContent('fetch-origins-array');
  const integrity = await cosSha256Integrity(content);

  const response = await fetch(cosEchoUrl(content), {
    integrity,
    crossOriginStorage: [location.origin],
  });
  assert_true(response.ok);
  assert_equals(await response.text(), content);

  // The response carries no Cross-Origin-Storage-Allow-Origin header, so the
  // store step's scope ceiling is empty and the list falls back to the
  // same-site default ("apply a COS scope ceiling"). Either way the storing
  // origin reads its own entry back.
  assert_equals(await cosReadText(cosHash(await cosSha256Hex(content))), content,
    'an array-valued crossOriginStorage stores the entry');
}, 'fetch: crossOriginStorage accepts the array list form as well as a string');

promise_test(async t => {
  // The member is part of the request, so it travels with a Request object,
  // including one copied from another, the way `integrity` does.
  const content = cosUniqueContent('fetch-request-object');
  await cosStore(content);
  const integrity = await cosSha256Integrity(content);
  const request = new Request(cosBrokenUrl(), {integrity, crossOriginStorage: ''});

  const response = await fetch(request);
  assert_true(response.ok,
    'a Request constructed with crossOriginStorage is served from COS');
  assert_equals(await response.text(), content);

  const copied = await fetch(new Request(request));
  assert_true(copied.ok, 'a Request copied from one carries its crossOriginStorage');
  assert_equals(await copied.text(), content);
}, 'fetch: crossOriginStorage on a Request object takes part in COS, also once copied');

promise_test(async t => {
  // Presence, not truthiness, is the opt-in: "" is falsy but still opts in,
  // which the first test above already relies on. The inverse is what this
  // one pins down -- omitting the member entirely, while keeping integrity,
  // must preserve today's behavior exactly.
  const content = cosUniqueContent('fetch-no-opt-in');
  const integrity = await cosSha256Integrity(content);

  const response = await fetch(cosEchoUrl(content), {integrity});
  assert_true(response.ok);
  assert_equals(await response.text(), content);

  await assertNotInCOS(t, content,
    'a fetch without crossOriginStorage must not write to COS');
}, 'fetch: omitting crossOriginStorage keeps integrity behavior and never writes to COS');

promise_test(async t => {
  // The read half of the same rule: an entry that *is* in COS must not
  // rescue a fetch that did not opt in.
  const content = cosUniqueContent('fetch-no-opt-in-read');
  await cosStore(content);
  const integrity = await cosSha256Integrity(content);

  await promise_rejects_js(t, TypeError,
    fetch(cosBrokenUrl(), {integrity}),
    'without crossOriginStorage, an integrity-checked 404 stays a network error');
}, 'fetch: omitting crossOriginStorage never consults COS, even for an entry that exists');

promise_test(async t => {
  // Piggybacking on integrity means inheriting its failure semantics: a hash
  // mismatch is a fetch failure whether or not COS is involved, and nothing
  // may be stored -- neither under the hash the caller declared nor under
  // the hash of the bytes that actually arrived.
  const content = cosUniqueContent('fetch-hash-mismatch');

  await promise_rejects_js(t, TypeError,
    fetch(cosEchoUrl(content), {
      integrity: COS_WRONG_INTEGRITY,
      crossOriginStorage: '*',
    }),
    'a hash mismatch rejects exactly as it does without COS');

  const declared = Array.from(atob(COS_WRONG_INTEGRITY.slice('sha256-'.length)),
    c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.getFileHandle(cosHash(declared)),
    'nothing was stored under the declared (mismatching) hash');
  await assertNotInCOS(t, content,
    'nothing was stored under the hash of the bytes that arrived either');
}, 'fetch: a response whose bytes do not match integrity is rejected and not stored');

promise_test(async t => {
  // crossOriginStorage without integrity has no hash to key an entry by.
  // Whether that is a TypeError at Request construction or a silently
  // ignored member is an open question for whatwg/fetch#1954; both candidate
  // answers agree that nothing may enter COS, which is what this asserts.
  const content = cosUniqueContent('fetch-no-integrity');
  let rejection = null;
  try {
    const response = await fetch(cosEchoUrl(content), {crossOriginStorage: '*'});
    await response.text();
  } catch (e) {
    rejection = e;
  }
  if (rejection) {
    assert_equals(rejection.name, 'TypeError',
      'if crossOriginStorage without integrity is refused, it is refused as a TypeError');
  }
  await assertNotInCOS(t, content,
    'with no integrity metadata there is no hash to store under, so COS stays untouched');
}, 'fetch: crossOriginStorage without integrity never stores anything');

promise_test(async t => {
  // A read that declares a wider scope than the entry was stored with is
  // still a read: for the storing origin it resolves either way. That the
  // wider value does not *widen* the entry needs a cross-site reader to
  // observe, and is checked in fetch-cross-origin.tentative.https.html.
  const content = cosUniqueContent('fetch-scope-not-widened');
  await cosStore(content);
  const integrity = await cosSha256Integrity(content);

  const response = await fetch(cosBrokenUrl(), {integrity, crossOriginStorage: '*'});
  assert_true(response.ok, 'the storing origin can still read its own entry');
  assert_equals(await response.text(), content);
}, 'fetch: reading with a wider crossOriginStorage value still resolves for the storing origin');

// "store a fetched resource in Cross-Origin Storage" runs "validate a COS
// request" on the declared origins and stores nothing if it fails. Each of
// these names an origin that could not itself call getFileHandle(): an `http:`
// origin on a host that is not potentially trustworthy, a scheme other than
// `http:` or `https:`, and a string that does not parse as a URL.
for (const [label, origin] of [
  ['an http: origin that is not potentially trustworthy', 'http://example.test'],
  ['a non-http(s) scheme', 'ftp://example.test'],
  ['an unparsable origin', 'not a url'],
]) {
  promise_test(async t => {
    const content = cosUniqueContent('fetch-invalid-origin');
    const integrity = await cosSha256Integrity(content);
    // Whether the host specification rejects the request up front or runs it
    // without COS is open in whatwg/fetch#1954; either way the store step's
    // validation fails, so nothing may enter COS.
    let rejection = null;
    try {
      const response = await fetch(cosEchoUrl(content), {integrity, crossOriginStorage: [origin]});
      await response.text();
    } catch (e) {
      rejection = e;
    }
    if (rejection) {
      assert_equals(rejection.name, 'TypeError',
        'if the invalid list is refused, it is refused as a TypeError');
    }
    await assertNotInCOS(t, content,
      'a list that fails "validate a COS request" stores nothing');
  }, `fetch: crossOriginStorage naming ${label} never stores anything`);
}

promise_test(async t => {
  // Integrity metadata may list several digests, and a match against any one
  // of them satisfies it. The store step recomputes the digest of the bytes,
  // so the entry is keyed by the hash these bytes actually produce and never
  // by another digest that merely sat next to it in the metadata.
  const content = cosUniqueContent('fetch-multiple-digests');
  const integrity = `${COS_WRONG_INTEGRITY} ${await cosSha256Integrity(content)}`;

  const response = await fetch(cosEchoUrl(content), {integrity, crossOriginStorage: ''});
  assert_true(response.ok, 'one matching digest satisfies the integrity check');
  assert_equals(await response.text(), content);

  assert_equals(await cosReadText(cosHash(await cosSha256Hex(content))), content,
    'the entry is stored under the digest the bytes produce');
  const declared = Array.from(atob(COS_WRONG_INTEGRITY.slice('sha256-'.length)),
    c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  await promise_rejects_dom(t, 'NotFoundError',
    navigator.crossOriginStorage.getFileHandle(cosHash(declared)),
    'nothing is stored under the other, non-matching digest');
}, 'fetch: with several integrity digests, the entry is keyed only by the one the bytes match');
