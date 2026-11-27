// Helpers for tests where a document loads an external style sheet that is
// served without a `Referrer-Policy` header.
//
// Per https://w3c.github.io/webappsec-referrer-policy/#integration-with-css,
// requests for the style sheet's subresources use the style sheet's referrer
// policy. The style sheet's referrer policy is stored "in the same way that
// Documents do" (an Issue in that section), and a policy container's referrer
// policy is initially the default referrer policy
// (https://html.spec.whatwg.org/multipage/browsers.html#policy-container-referrer-policy).
// So, without a `Referrer-Policy` header, the subresource requests use the
// default referrer policy (`strict-origin-when-cross-origin`), not the
// document's referrer policy.
//
// The style sheet is loaded from a different origin than the document, and
// its subresources are loaded from the document's origin. This makes the
// subresource requests cross-origin with respect to their referrer (the style
// sheet URL), so that the default referrer policy sends only the style sheet's
// origin, unlike the `no-referrer` and `unsafe-url` policies of the documents,
// while keeping them same-origin with the document (which SVG resource
// requests without `cross-origin()` require).
//
// Depends on `/common/utils.js` and
// `/common/security-features/resources/common.sub.js`.

// Returns a description of `referrer` (the `Referer` header sent for a
// subresource of the style sheet at `css_url`) that does not contain the random
// token in `css_url`, so that failure messages are stable across runs.
function describeReferrer(referrer, css_url) {
  if (referrer === undefined) {
    return 'no referrer';
  }
  if (referrer === css_url) {
    return 'the style sheet URL';
  }
  if (referrer === new URL(css_url).origin + '/') {
    return 'the style sheet origin';
  }
  return 'an unexpected referrer: ' + referrer;
}

// Defines a `promise_test()` that loads
// `/referrer-policy/css-integration/resources/<sheet>.sub.css` (served without
// a `Referrer-Policy` header) from a different origin with the query
// parameters `params`, waits for the subresource requested by the style sheet,
// and checks the `Referer` header reported by
// `/common/security-features/subresource/<subresource_handler>`.
//
// `expected` is "no referrer", "the style sheet URL", or
// "the style sheet origin" (see `describeReferrer()`).
function testExternalStyleSheetWithoutReferrerPolicyHeader(
    {sheet, params = {}, subresource_handler, expected}, description) {
  promise_test(async t => {
    const id = token();
    const css_url = new URL(
        `/referrer-policy/css-integration/resources/${sheet}.sub.css`,
        `${location.protocol}//www1.${location.hostname}:${location.port}`);
    css_url.search = new URLSearchParams({id, ...params}).toString();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = css_url.href;
    await new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = () => reject(new Error('Failed to load the style sheet'));
      document.head.appendChild(link);
    });
    t.add_cleanup(() => link.remove());

    // There is no way to wait for a resource referenced from CSS to be loaded,
    // so wait for a while (see ../README.md).
    await timeoutPromise(t, 1000);

    const message = await requestViaXhr(
        `${location.origin}/common/security-features/subresource/` +
        `${subresource_handler}?id=${id}&report-headers`);
    assert_own_property(message, 'headers');
    assert_equals(describeReferrer(message.referrer, css_url.href), expected);
  }, description);
}
