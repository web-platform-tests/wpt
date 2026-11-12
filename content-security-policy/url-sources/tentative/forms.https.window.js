// META: title=Url sources of different forms of URL strings
// META: variant=?source=hash
// META: script=/common/get-host-info.sub.js
// META: script=support/util.js

// Different forms of URL strings. The URL string is matched as written,
// without normalizing it like the URL parser does, so an author can allow
// what's in the markup. The absolute URL it resolves to isn't matched, unless
// it's what's written.

const { ORIGIN, REMOTE_ORIGIN } = get_host_info();
const HOST = new URL(ORIGIN).host;
const REMOTE_HOST = new URL(REMOTE_ORIGIN).host;
// The path of the support directory, ending with "/".
const DIR = new URL("support/", location.href).pathname;

url_string_test({
  name: "url sources should allow script with a relative URL string by its URL string",
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a relative URL string with a directory by its URL string",
  url_string: "child_dir/externalScript.js",
  allowed: "child_dir/externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow script with a relative URL string by the URL string with a single-dot segment",
  url_string: "externalScript.js",
  allowed: "./externalScript.js",
  expected: 'CSP_VIOLATION',
});

url_string_test({
  name: "url sources should allow script with a relative URL string in a document in another directory by its URL string",
  frame: "child_dir/iframe",
  url_string: "externalScript.js",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a double-dot segment in its URL string in a document in another directory by its URL string",
  frame: "child_dir/iframe",
  url_string: "../externalScript.js",
  allowed: "../externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with an absolute URL string by its URL string",
  url_string: `${ORIGIN}${DIR}externalScript.js`,
  allowed: `${ORIGIN}${DIR}externalScript.js`,
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow script with an absolute URL string by a relative URL string",
  url_string: `${ORIGIN}${DIR}externalScript.js`,
  allowed: "externalScript.js",
  expected: 'CSP_VIOLATION',
});

url_string_test({
  name: "url sources should allow script with a path-absolute URL string by its URL string",
  url_string: `${DIR}externalScript.js`,
  allowed: `${DIR}externalScript.js`,
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // As used by https://arturjanc.com/csp-hashes-demo/ pages.
  name: "url sources should allow script with a path-absolute URL string with a query by its URL string",
  url_string: `${DIR}externalScript.js?cb=console.log&arg=1`,
  allowed: `${DIR}externalScript.js?cb=console.log&arg=1`,
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow script with a path-absolute URL string with a space in the query by its serialized absolute URL",
  url_string: `${DIR}externalScript.js?arg=Script 2`,
  allowed: `${ORIGIN}${DIR}externalScript.js?arg=Script%202`,
  expected: 'CSP_VIOLATION',
});

url_string_test({
  name: "url sources should not allow script with a path-absolute URL string by a path-relative URL string",
  url_string: `${DIR}externalScript.js`,
  allowed: "externalScript.js",
  expected: 'CSP_VIOLATION',
});

url_string_test({
  name: "url sources should allow script with a single-dot segment in its URL string by its URL string",
  url_string: "./externalScript.js",
  allowed: "./externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow script with a single-dot segment in its URL string by the URL string without it",
  url_string: "./externalScript.js",
  allowed: "externalScript.js",
  expected: 'CSP_VIOLATION',
});

url_string_test({
  name: "url sources should allow script with a double-dot segment in its URL string by its URL string",
  url_string: "child_dir/../externalScript.js",
  allowed: "child_dir/../externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a backslash in its URL string by its URL string",
  url_string: "child_dir\\externalScript.js",
  allowed: "child_dir\\externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a space in the query of its URL string by its URL string",
  url_string: "externalScript.js?a b",
  allowed: "externalScript.js?a b",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with an empty query in its URL string by its URL string",
  url_string: "externalScript.js?",
  allowed: "externalScript.js?",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a percent-encoded character in its URL string by its URL string",
  url_string: "external%53cript.js",
  allowed: "external%53cript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a non-ASCII character in the query of its URL string by its URL string",
  url_string: "externalScript.js?\u00fc",
  allowed: "externalScript.js?\u00fc",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // The URL string is matched without its fragment, which doesn't affect
  // what's requested.
  name: "url sources should allow script with a fragment in its URL string by the URL string without it",
  url_string: "externalScript.js#fragment",
  allowed: "externalScript.js",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // The URL string is the attribute value, not the markup, so character
  // references are decoded. The support document escapes "&" as "&amp;" in
  // the markup.
  name: "url sources should allow script with a character reference in its src attribute by the decoded URL string",
  url_string: "externalScript.js?a=1&b=2",
  allowed: "externalScript.js?a=1&b=2",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // The URL parser strips the whitespace, but the URL string keeps it.
  name: "url sources should allow script with whitespace around its URL string by the URL string including it",
  url_string: " externalScript.js ",
  allowed: " externalScript.js ",
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow script with a same-origin scheme-relative URL string by its URL string",
  url_string: `//${HOST}${DIR}externalScript.js`,
  allowed: `//${HOST}${DIR}externalScript.js`,
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow cross-origin script with a scheme-relative URL string by its URL string",
  url_string: `//${REMOTE_HOST}${DIR}externalScript.js`,
  allowed: `//${REMOTE_HOST}${DIR}externalScript.js`,
  expected: 'SCRIPT_RAN',
});

url_string_test({
  // Url sources are matched against the URL string the request was made
  // with, not the target of a redirect.
  name: "url sources should allow redirected script with a path-absolute URL string by its URL string",
  url_string: `/common/redirect.py?location=` +
    encodeURIComponent(`${ORIGIN}${DIR}externalScript.js`),
  allowed: `/common/redirect.py?location=` +
    encodeURIComponent(`${ORIGIN}${DIR}externalScript.js`),
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow script with a query in its URL string by the URL string without it",
  url_string: "externalScript.js?v=1",
  allowed: "externalScript.js",
  expected: 'CSP_VIOLATION',
});

url_string_test({
  name: "url sources should allow script with an uppercase scheme and host in its absolute URL string by its URL string",
  url_string: `${ORIGIN.toUpperCase()}${DIR}externalScript.js`,
  allowed: `${ORIGIN.toUpperCase()}${DIR}externalScript.js`,
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should allow cross-origin script with an absolute URL string by its URL string",
  url_string: `${REMOTE_ORIGIN}${DIR}externalScript.js`,
  allowed: `${REMOTE_ORIGIN}${DIR}externalScript.js`,
  expected: 'SCRIPT_RAN',
});

url_string_test({
  name: "url sources should not allow cross-origin script by a relative URL string",
  url_string: `${REMOTE_ORIGIN}${DIR}externalScript.js`,
  allowed: "externalScript.js",
  expected: 'CSP_VIOLATION',
});