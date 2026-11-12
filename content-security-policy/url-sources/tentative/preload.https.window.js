// META: title=Url sources of the URL strings of preloaded scripts
// META: variant=?source=hash
// META: script=support/util.js

// Classic scripts preloaded by a <link rel=preload> and module scripts
// preloaded by a <link rel=modulepreload>, before a <script> element requests
// them. The preload is checked against the policy too, with the URL string of
// the <link>'s href attribute. If it's blocked, a violation is reported before
// the script runs, even if the script itself would be allowed. A module which
// failed to preload also fails to be imported.
//
// The <script> element is only created once the script is preloaded, as
// otherwise the speculative parser could request it before the preload.
//
// A relative URL string is allowed by its url source both when matching the
// URL relative to the document and when matching the URL string as written. A
// URL string with a single-dot segment is only allowed when matching the URL
// string as written.

const preloads = [
  {what: "script preloaded by <link rel=preload>", preload: "preload"},
  {
    what: "module script preloaded by <link rel=modulepreload>",
    preload: "modulepreload",
    script_type: "module",
  },
];

for (const {what, ...preload} of preloads) {
  url_string_test({
    name: `url sources should allow ${what} with a relative URL string by its URL string`,
    ...preload,
    url_string: "externalScript.js",
    allowed: "externalScript.js",
    expected: 'SCRIPT_RAN',
  });

  url_string_test({
    name: `url sources should allow ${what} with a single-dot segment in its URL string by its URL string`,
    ...preload,
    url_string: "./externalScript.js",
    allowed: "./externalScript.js",
    expected: 'SCRIPT_RAN',
  });
}
