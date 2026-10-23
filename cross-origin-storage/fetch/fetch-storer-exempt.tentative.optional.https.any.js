// META: global=window,dedicatedworker,sharedworker
// META: script=../resources/helpers.js
// META: script=../resources/integration-helpers.js
//
// https://wicg.github.io/cross-origin-storage/#availability-gating
// https://wicg.github.io/cross-origin-storage/#cross-site-probing
// https://github.com/WICG/cross-origin-storage#potential-mitigations
//
// Optional: a cross-site lookup budget is an example mitigation in the spec's
// non-normative privacy considerations and the explainer. As described there,
// it is keyed on the top-level site, shared by every frame on the page, and
// persists across reloads for a time window, and lookups for files the
// requesting site stored itself stay free. Lookups through the host
// integrations count against it alongside getFileHandle() calls. Moved here
// from probe-budget.tentative.https.any.js.

'use strict';

// Enough repetitions that a per-lookup charge would run out of any plausible
// budget, all against a single entry this origin stored itself.
const REPEATS = 20;

promise_test(async t => {
  // The storing-origin exemption is a property of the lookup algorithm, not
  // of getFileHandle(), so it must hold for an integration lookup too.
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
