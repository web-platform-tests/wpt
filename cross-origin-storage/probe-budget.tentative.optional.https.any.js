// META: global=window,dedicatedworker,sharedworker
// META: script=resources/helpers.js
//
// A cross-site lookup budget, and rate limiting of lookups in general:
// https://wicg.github.io/cross-origin-storage/#availability-gating
// https://wicg.github.io/cross-origin-storage/#cross-site-probing
//
// This file is optional. The specification describes a lookup budget only in
// a non-normative note, as an example mitigation for user agents that block
// third-party cookies: a small budget of cross-site lookups keyed on the
// top-level site and shared by every frame on the page, counted across
// reloads for a time window. It also says a user agent should rate-limit or
// otherwise throttle repeated `getFileHandle()` calls. Neither defines what is
// charged, so the test names below describe what each test observes, and the
// comments explain the mitigation it is meant to sit alongside.
//
// The budget's size is implementation-defined, and "complete a read request"
// only ever refuses with NotFoundError, so a read refused for being over budget
// is indistinguishable from a genuine miss and no test can observe the budget
// directly. What is testable is that a storing origin keeps reading its own
// entries, that create requests keep working, and that no refusal surfaces an
// error other than NotFoundError.
//
// These tests deliberately keep their own distinct-hash footprint small. Such
// a budget would be shared by everything running under the test page's
// top-level site and persist across reloads, so a test that exhausted it on
// purpose would degrade every later test of the run.
//
// The specification notes that a rate limit is only effective if lookups from
// the host integrations are counted alongside `getFileHandle()` calls. The
// last test here covers the fetch surface, which is the one a page can drive
// in a loop as easily as an imperative call.

'use strict';

// Enough repetitions that a per-call charge on a storing origin's own reads
// would plausibly run out.
const REPEATS = 20;

// Small enough to stay well inside any plausible budget, since exhausting it
// would damage the rest of the run (see above).
const DISTINCT = 4;

promise_test(async t => {
  // "determine COS disclosure" step 2 returns the entry to any origin in its
  // storing origins, and an origin that has written an entry "can always
  // subsequently obtain a handle for it", so no number of reads can be
  // refused, for budget reasons or any other.
  const content = cosUniqueContent('budget-storer-exempt');
  const {hash} = await cosStore(content);
  for (let i = 0; i < REPEATS; ++i) {
    assert_equals(await cosReadText(hash), content,
      `read ${i + 1} of ${REPEATS} of an entry this origin stored itself`);
  }
}, 'a storing origin is never charged: repeated reads of its own entry always succeed');

promise_test(async t => {
  // A never-stored hash has no entry, so "complete a read request" rejects
  // every read of it with NotFoundError, however many times it is repeated and
  // whether or not a user agent charges the repeats.
  const hash = cosMissingHash();
  const names = [];
  for (let i = 0; i < REPEATS; ++i) {
    try {
      await navigator.crossOriginStorage.getFileHandle(hash);
      assert_unreached(`read ${i + 1} of a never-stored hash must not resolve`);
    } catch (e) {
      names.push(e.name);
    }
  }
  assert_array_equals(names, new Array(REPEATS).fill('NotFoundError'),
    'every repeat probe of one hash must answer identically to the first');
}, 'repeating one probe of a never-stored hash answers NotFoundError every time');

promise_test(async t => {
  // A create request discloses nothing about prior presence (it returns a
  // handle whether or not the entry exists), so a budget for presence lookups
  // has no reason to apply to it. After several probes, a create request and
  // the storing origin's read of what it stored must still work.
  for (let i = 0; i < DISTINCT; ++i) {
    await promise_rejects_dom(t, 'NotFoundError',
      navigator.crossOriginStorage.getFileHandle(cosMissingHash()));
  }

  const content = cosUniqueContent('budget-create-uncharged');
  const {hash} = await cosStore(content);
  assert_equals(await cosReadText(hash), content,
    'a create request, and the read of what it stored, must be unaffected by read-probe spending');
}, 'a create request, and the storer\'s read of what it stored, keep working after read probes');

promise_test(async t => {
  // "complete a read request" only rejects with NotFoundError, so whatever
  // budget or rate limit a user agent applies, running out of it must never be
  // distinguishable from a miss. A user agent that surfaced a dedicated error,
  // or that let a quota-style exception escape, would hand callers exactly the
  // oracle the budget exists to deny them.
  const names = new Set();
  for (let i = 0; i < DISTINCT; ++i) {
    try {
      await navigator.crossOriginStorage.getFileHandle(cosMissingHash());
      assert_unreached('a read of a never-stored hash must not resolve');
    } catch (e) {
      names.add(e.name);
    }
  }
  assert_array_equals([...names], ['NotFoundError'],
    'probing distinct hashes must only ever reject with NotFoundError');
}, 'probes of distinct never-stored hashes only ever reject with NotFoundError');

promise_test(async t => {
  // An origin with a write of its own still in flight gets no special answer:
  // the hash has no entry yet, so the read is an ordinary miss. Earlier drafts
  // gave a pending writer a distinguishable NotAllowedError here, which was a
  // disclosure.
  // https://wicg.github.io/cross-origin-storage/#in-progress-writes
  for (let i = 0; i < DISTINCT; ++i) {
    const content = cosUniqueContent(`budget-in-flight-${i}`);
    const hash = cosHash(await cosSha256Hex(content));
    const handle = await navigator.crossOriginStorage.getFileHandle(
      hash, {create: true});
    await promise_rejects_dom(t, 'NotFoundError',
      navigator.crossOriginStorage.getFileHandle(hash),
      'a hash with only an in-flight write must read as a plain miss');

    // Finish the write, so that this leaves an entry behind.
    const writable = await handle.createWritable();
    await writable.write(new Blob([content]));
    await writable.close();
    assert_equals(await cosReadText(hash), content);
  }
}, 'an origin reading back a hash it has begun writing gets an ordinary miss');

// A same-origin URL that reliably 404s, so a fetch that succeeds against it
// can only have been served from COS.
function cosBrokenUrl() {
  return new URL(`./does-not-exist-${Math.random()}.txt`, location.href).href;
}

promise_test(async t => {
  // Running out of budget must be indistinguishable from a miss on every
  // surface. On this one that is structural: a refused lookup falls through
  // to the network, so the caller sees whatever the network did and never a
  // COS-specific error. A user agent that surfaced one here would hand
  // callers the oracle the budget exists to deny them.
  //
  // Note that this holds trivially in a browser that does not implement the
  // integration at all, so a pass here is weaker evidence than the tests
  // above it. It is still worth pinning down: the failure it guards against
  // is a user agent that grows a distinct signal for a refused lookup.
  const names = new Set();
  for (let i = 0; i < DISTINCT; ++i) {
    const content = cosUniqueContent(`budget-fetch-miss-${i}`);
    try {
      await fetch(cosBrokenUrl(), {
        integrity: await cosSha256Integrity(content),
        crossOriginStorage: '*',
      });
      assert_unreached('a fetch of a 404 URL declaring a never-stored hash must not resolve');
    } catch (e) {
      names.add(e.name);
    }
  }
  assert_array_equals([...names], ['TypeError'],
    'a fetch whose COS lookup does not produce an entry fails as an ordinary ' +
    'integrity-checked network error, with no distinct signal for a refused lookup');
}, 'a fetch() lookup that finds nothing is indistinguishable from an ordinary network miss');
