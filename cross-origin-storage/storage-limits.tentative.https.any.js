// META: global=window,worker
// META: script=resources/helpers.js
//
// Tests what is testable about storage management without knowing an
// implementation's actual, implementation-defined limits:
// https://wicg.github.io/cross-origin-storage/#storage-limits
//
// The exact per-origin byte quota and maximum origins list length are both
// implementation-defined and deliberately unobservable from script -- a
// caller has no way to query either, and this suite has no test-only hook
// for them. That means the *boundary* itself -- the specific write that
// finally trips QuotaExceededError, or the specific list-widening call that
// finally gets silently capped -- can't be triggered deterministically here,
// and this file does not attempt to. What the spec text does make
// implementation-independently testable are two "this must never fail"
// guarantees; those are what the tests below check.

'use strict';

promise_test(async t => {
  // "Because entries are content-addressable, an origin that repeatedly
  // writes the same bytes under the same hash does not consume additional
  // quota beyond the first successful write." If repeated writes of
  // identical content did consume quota, doing this enough times would
  // eventually risk tripping a real implementation's quota -- so many
  // back-to-back successes here is reasonable (if not airtight, given the
  // limit is unknown) evidence that repeats are quota-free, without this
  // test needing to know the actual limit.
  const content = cosUniqueContent('quota-free-repeated-identical-write');
  const hash = cosHash(await cosSha256Hex(content));
  for (let i = 0; i < 25; i++) {
    const handle = await navigator.crossOriginStorage.requestFileHandle(
      hash, {create: true});
    const writable = await handle.createWritable();
    await writable.write(new Blob([content]));
    await writable.close();
  }
  assert_equals(await cosReadText(hash), content);
}, 'writing identical bytes under the same hash repeatedly never fails due to quota, per content-addressable deduplication');

promise_test(async t => {
  // The *cumulative* origins-list-length cap -- reached across many
  // separate writes, possibly by unrelated origins over a long period of
  // time -- is explicitly required to never fail the write that happens to
  // be the one that crosses it; only the origins beyond capacity are
  // silently dropped from the entry, with a console warning. This is
  // testable without knowing the actual limit: many small, separate
  // widenings, each adding exactly one previously-unlisted origin, must
  // never themselves produce an error, regardless of where (or whether)
  // the implementation-defined cap is eventually crossed partway through.
  const content = cosUniqueContent('cumulative-origins-growth-never-errors');
  const value = await cosSha256Hex(content);
  const hash = cosHash(value);

  const initialHandle = await navigator.crossOriginStorage.requestFileHandle(
    hash, {create: true});
  const initialWritable = await initialHandle.createWritable();
  await initialWritable.write(new Blob([content]));
  await initialWritable.close();

  for (let i = 0; i < 20; i++) {
    const handle = await navigator.crossOriginStorage.requestFileHandle(
      hash, {create: true, origins: [`https://cos-quota-growth-${i}.example`]});
    const writable = await handle.createWritable();
    await writable.write(new Blob([content]));
    await writable.close();
  }

  // The storer must still be able to read its own resource throughout,
  // regardless of how many of the requested origins ended up actually
  // retained.
  assert_equals(await cosReadText(hash), content);
}, 'resource visibility upgrade: cumulative origins-list growth across many separate writes never fails the write itself, even once an implementation-defined capacity may have been exceeded');
