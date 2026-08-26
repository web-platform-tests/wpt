// META: global=window,worker
// META: script=resources/helpers.js
//
// The cross-origin probe budget:
// https://wicg.github.io/cross-origin-storage/#cross-site-identifiers
// https://wicg.github.io/cross-origin-storage/#storage-limits
//
// The budget's size is implementation-defined, and a read refused for being
// over budget is deliberately indistinguishable from a genuine miss, so no
// test can observe the budget directly -- that indistinguishability is the
// security property, not an obstacle to be worked around. What is testable is
// everything the budget must never do: refuse a storing origin, charge the
// same hash more than once, charge a create request, or surface an error that
// tells a caller it ran out.
//
// These tests deliberately keep their own distinct-hash footprint small. The
// budget is per-origin and persists across page loads, and it replenishes only
// on user activation -- which a worker can never obtain -- so a test that
// exhausted it on purpose would degrade every later test sharing this origin
// for the rest of the run, with no way to restore it.
//
// The budget is charged on every surface that reaches the registry, not only
// requestFileHandle(): the three declarative integrations and the
// crossOriginStorage option on fetch() all resolve a hash the same way and
// all yield the same single bit. The last two tests here cover the fetch
// surface, which is the one a page can drive in a loop as easily as an
// imperative call.

'use strict';

// Enough repetitions that a per-call charge would run out, but all against a
// single hash, which costs a single charge.
const REPEATS = 20;

// Small enough to stay well inside any plausible budget, since exhausting it
// would damage the rest of the run (see above).
const DISTINCT = 4;

promise_test(async t => {
  // "complete a read request" consults storing origins before charging, so an
  // origin reading an entry it wrote itself is never charged at all, and no
  // number of reads can be refused for budget reasons.
  const content = cosUniqueContent('budget-storer-exempt');
  const {hash} = await cosStore(content);
  for (let i = 0; i < REPEATS; ++i) {
    assert_equals(await cosReadText(hash), content,
      `read ${i + 1} of ${REPEATS} of an entry this origin stored itself`);
  }
}, 'a storing origin is never charged: repeated reads of its own entry always succeed');

promise_test(async t => {
  // Counted in distinct hashes, not calls: re-probing a hash yields no bit the
  // origin does not already have, so only the first probe is charged and every
  // later one must answer the same way.
  const hash = cosMissingHash();
  const names = [];
  for (let i = 0; i < REPEATS; ++i) {
    try {
      await navigator.crossOriginStorage.requestFileHandle(hash);
      assert_unreached(`read ${i + 1} of a never-stored hash must not resolve`);
    } catch (e) {
      names.push(e.name);
    }
  }
  assert_array_equals(names, new Array(REPEATS).fill('NotFoundError'),
    'every repeat probe of one hash must answer identically to the first');
}, 'the budget is counted in distinct hashes, not calls: repeating one probe answers consistently');

promise_test(async t => {
  // A create request discloses nothing about prior presence -- it returns a
  // handle whether or not the entry exists -- so it is not charged, and must
  // keep working regardless of how much read budget has been spent.
  for (let i = 0; i < DISTINCT; ++i) {
    await promise_rejects_dom(t, 'NotFoundError',
      navigator.crossOriginStorage.requestFileHandle(cosMissingHash()));
  }

  const content = cosUniqueContent('budget-create-uncharged');
  const {hash} = await cosStore(content);
  assert_equals(await cosReadText(hash), content,
    'a create request, and the read of what it stored, must be unaffected by read-probe spending');
}, 'a create request is never charged against the probe budget');

promise_test(async t => {
  // Whatever the budget is, running out of it must never be distinguishable
  // from a miss. A user agent that surfaced a dedicated error -- or that let a
  // quota-style exception escape -- would hand callers exactly the oracle the
  // budget exists to deny them.
  const names = new Set();
  for (let i = 0; i < DISTINCT; ++i) {
    try {
      await navigator.crossOriginStorage.requestFileHandle(cosMissingHash());
      assert_unreached('a read of a never-stored hash must not resolve');
    } catch (e) {
      names.add(e.name);
    }
  }
  assert_array_equals([...names], ['NotFoundError'],
    'probing distinct hashes must only ever reject with NotFoundError');
}, 'running out of budget is not distinguishable from a genuine miss');

promise_test(async t => {
  // An origin holding an outstanding create handle is exempt too, for the same
  // reason a storing origin is: the NotAllowedError it gets back tells it only
  // that its own write is still in flight. Probing under a fresh hash each
  // time would be charged; this must not be.
  for (let i = 0; i < DISTINCT; ++i) {
    const content = cosUniqueContent(`budget-pending-writer-${i}`);
    const hash = cosHash(await cosSha256Hex(content));
    const handle = await navigator.crossOriginStorage.requestFileHandle(
      hash, {create: true});
    await promise_rejects_dom(t, 'NotAllowedError',
      navigator.crossOriginStorage.requestFileHandle(hash),
      'a pending writer reading its own in-flight entry is exempt from the charge, ' +
      'so this must be NotAllowedError and never a budget-refused NotFoundError');

    // Finish the write so the entry is not left pending for later tests.
    const writable = await handle.createWritable();
    await writable.write(new Blob([content]));
    await writable.close();
  }
}, 'an origin with a write of its own in flight is never charged for reading it back');

// A same-origin URL that reliably 404s, so a fetch that succeeds against it
// can only have been served from COS.
function cosBrokenUrl() {
  return new URL(`./does-not-exist-${Math.random()}.txt`, location.href).href;
}

promise_test(async t => {
  // The storing-origin exemption is a property of the lookup algorithm, not
  // of requestFileHandle(), so it must hold for an integration lookup too.
  // If the fetch integration reached the registry by some other route it
  // would either be charged when it should not be, or -- worse -- not be
  // charged when it should.
  const content = cosUniqueContent('budget-fetch-storer-exempt');
  await cosStore(content);
  const integrity = await cosSha256Integrity(content);

  for (let i = 0; i < REPEATS; ++i) {
    const response = await fetch(cosBrokenUrl(), {integrity, crossOriginStorage: ''});
    assert_true(response.ok,
      `COS-served fetch ${i + 1} of ${REPEATS} of an entry this origin stored itself`);
    assert_equals(await response.text(), content);
  }
}, 'a storing origin is never charged for reading its own entry back through fetch()');

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
