// META: title=Url sources of URL strings resolved against a base URL
// META: variant=?source=hash
// META: script=/common/get-host-info.sub.js
// META: script=support/util.js

// URL strings resolved against a base URL other than the document URL. The
// URL string is matched as written, wherever it resolves, so an author can
// allow what's in the markup, whatever the base URL is, and not the absolute
// URL it resolves to.
//
// So an injected <base> can make an allowed relative URL string load a
// different script, also from another origin, unless the document prevents
// it: with base-uri, which ignores a <base> whose URL it doesn't allow, or
// with a <base> of its own before any injected one, as only the first one is
// used. These tests show both. Whether url sources should also protect
// documents which don't, e.g. by matching URL strings which aren't absolute
// URLs only for same-origin scripts, is discussed in
// https://github.com/w3c/webappsec-csp/issues/826.

const { ORIGIN, REMOTE_ORIGIN } = get_host_info();
// The path of the support directory, ending with "/".
const DIR = new URL("support/", location.href).pathname;

url_string_test({
  name: "url sources should allow script relative to a same-origin base URL by its URL string",
  base_urls: ["child_dir/"],
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow script relative to a same-origin base URL by its URL relative to the document",
  base_urls: ["child_dir/"],
  url_string: "externalScript.js",
  allowed: "child_dir/externalScript.js",
  expected: 'CSP_VIOLATION',
});

url_string_test({
  // Only the URL string is matched, not the absolute URL it resolves to.
  name: "url sources should not allow script relative to a same-origin base URL by its absolute URL",
  base_urls: ["child_dir/"],
  url_string: "externalScript.js",
  allowed: `${ORIGIN}${DIR}child_dir/externalScript.js`,
  expected: 'CSP_VIOLATION',
});

url_string_test({
  // Like single-page applications using <base href="/"> on pages with deeper
  // paths.
  name: "url sources should allow script relative to a base URL of a parent directory by its URL string",
  base_urls: [`${DIR}../`],
  url_string: "support/externalScript.js",
  allowed: "support/externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // Without base-uri, an injected cross-origin <base> makes an allowed
  // relative URL string load a script from another origin.
  name: "url sources should allow script relative to an injected cross-origin base URL without base-uri by its URL string",
  base_urls: [`${REMOTE_ORIGIN}${DIR}`],
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // The same applies to a document's own cross-origin <base>, which base-uri
  // can allow.
  name: "url sources should allow script relative to the document's own cross-origin base URL allowed by base-uri by its URL string",
  base_urls: [`${REMOTE_ORIGIN}${DIR}`],
  policy: `base-uri ${REMOTE_ORIGIN}`,
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow script relative to a cross-origin base URL by its absolute URL",
  base_urls: [`${REMOTE_ORIGIN}${DIR}`],
  url_string: "externalScript.js",
  allowed: `${REMOTE_ORIGIN}${DIR}externalScript.js`,
  expected: 'CSP_VIOLATION',
});

url_string_test({
  name: "url sources should allow script relative to the document's own base URL followed by an injected cross-origin one by its URL string",
  base_urls: ["child_dir/", `${REMOTE_ORIGIN}${DIR}`],
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script relative to the document's own base URL followed by an injected same-origin one by its URL string",
  base_urls: ["./", "child_dir/"],
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // base-uri 'self' keeps an injected cross-origin <base> from taking effect,
  // so the URL string resolves against the document URL. The base-uri
  // violation isn't the result of the test.
  name: "url sources should allow script despite a cross-origin base URL blocked by base-uri by its URL string",
  base_urls: [`${REMOTE_ORIGIN}${DIR}`],
  policy: "base-uri 'self'",
  ignored_violation_directive: "base-uri",
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // But base-uri 'self' doesn't block an injected same-origin <base>, which
  // makes an allowed relative URL string load a different same-origin script.
  // base-uri 'none' or a <base> of the document's own before it prevent it, as
  // do path-absolute or absolute URL strings, which a same-origin <base> can't
  // change.
  name: "url sources should allow script relative to an injected same-origin base URL not blocked by base-uri 'self' by its URL string",
  base_urls: ["child_dir/"],
  policy: "base-uri 'self'",
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // Nor does a path in base-uri, which matches as a prefix, so base-uri can't
  // allow only the document's own base URL: an injected <base> in a
  // subdirectory of it is allowed too, and as only the first <base> is used,
  // it takes effect if it's injected before the document's own.
  name: "url sources should allow script relative to an injected base URL in a subdirectory of a base URL allowed by base-uri by its URL string",
  // The injected one, then the document's own, i.e. the support directory.
  base_urls: ["child_dir/", "./"],
  policy: `base-uri ${ORIGIN}${DIR}`,
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // Likewise, base-uri 'none' keeps an injected same-origin <base> from taking
  // effect.
  name: "url sources should allow script despite a same-origin base URL blocked by base-uri 'none' by its URL string",
  base_urls: ["child_dir/"],
  policy: "base-uri 'none'",
  ignored_violation_directive: "base-uri",
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});
