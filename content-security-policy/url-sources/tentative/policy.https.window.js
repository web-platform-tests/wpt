// META: title=Scripts allowed by url sources in policies
// META: variant=?source=hash
// META: script=/common/get-host-info.sub.js
// META: script=support/util.js

// Scripts are allowed by the URL strings they're requested with, e.g. the
// value of the src attribute. add_dynamic_script.js inserts externalScript.js
// with an absolute URL string.
const { ORIGIN, REMOTE_ORIGIN } = get_host_info();
const scriptUrl = new URL("support/externalScript.js", location.href).href;
const redirectUrl =
  new URL(`/common/redirect.py?location=${scriptUrl}`, location.href).href;

for (const test_type of ["header", "metatag"]) {
  url_string_test({
    name: "script-src should allow script by its url source",
    test_type,
    url_string: "externalScript.js",
    allowed: "externalScript.js",
    expected: 'SCRIPT_RAN',
  });

  url_string_test({
    name: "a url source should make host sources ignored",
    test_type,
    sources: `${ORIGIN} ${REMOTE_ORIGIN}`,
    url_string: "externalScript.js",
    allowed: "foo.js",
    expected: 'CSP_VIOLATION',
  });

  url_string_test({
    name: "default-src should allow script by its url source",
    test_type,
    directive: "default-src",
    url_string: "externalScript.js",
    allowed: "externalScript.js",
    expected: 'SCRIPT_RAN',
  });

  url_string_test({
    name: "script-src-elem should allow script by its url source",
    test_type,
    directive: "script-src-elem",
    url_string: "externalScript.js",
    allowed: "externalScript.js",
    expected: 'SCRIPT_RAN',
  });

  url_string_test({
    // add_dynamic_script.js inserts externalScript.js, which isn't allowed.
    name: "url sources should not allow dynamically inserted script transitively",
    test_type,
    url_string: "add_dynamic_script.js",
    allowed: "add_dynamic_script.js",
    expected: 'CSP_VIOLATION',
  });

  url_string_test({
    name: "url sources should allow dynamically inserted script if allowed itself",
    test_type,
    url_string: "add_dynamic_script.js",
    allowed: ["add_dynamic_script.js", scriptUrl],
    expected: 'SCRIPT_RAN',
  });

  url_string_test({
    // The target of the redirect, externalScript.js, isn't allowed itself.
    name: "url sources should allow redirected scripts",
    test_type,
    url_string: redirectUrl,
    allowed: redirectUrl,
    expected: 'SCRIPT_RAN',
  });
}
