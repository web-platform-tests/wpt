// META: title='strict-dynamic-url' with scripts allowed by url sources
// META: variant=?source=hash
// META: script=support/util.js

// The behavior of 'strict-dynamic-url' which doesn't depend on url sources is
// tested in /content-security-policy/strict-dynamic-url/.

for (const test_type of ["header", "metatag"]) {
  promise_test(async t => {
    // add_dynamic_script.js inserts externalScript.js, which isn't allowed
    // itself.
    const policy = `script-src 'nonce-forinlinescript' 'strict-dynamic-url' ` +
      `${await url_source("add_dynamic_script.js")}`;

    const result = await load_frame(t, get_support_url(
        test_type, 'iframe', policy, {script_url: 'add_dynamic_script.js'}));
    assert_equals(result, 'SCRIPT_RAN');
  }, `strict-dynamic-url should allow script dynamically inserted by a ` +
     `script allowed by its url source - ${test_type}`);
}
