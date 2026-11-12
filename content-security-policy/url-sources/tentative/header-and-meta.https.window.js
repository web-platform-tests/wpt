// META: title=Url sources in policies in headers and meta tags
// META: variant=?source=hash
// META: script=support/util.js

// Some of these tests set CSP in both the header and the meta tag, others set
// multiple policies in multiple meta tags. They all load externalScript.js,
// which they allow by its URL string.

const scriptUrlString = "externalScript.js";

promise_test(async t => {
  const headerPolicy = `script-src 'nonce-forinlinescript'`;
  const metaPolicy = `script-src 'nonce-forinlinescript' ` +
    `${await url_source(scriptUrlString)}`;

  const result = await load_frame(t, get_support_url('metatag', 'iframe',
      metaPolicy, {
        pipe: `header(Content-Security-Policy,${headerPolicy})`,
        script_url: 'externalScript.js',
      }));
  assert_equals(result, 'CSP_VIOLATION');
}, "url source in meta tag should not relax policy set by header");

promise_test(async t => {
  const headerPolicy = `script-src 'nonce-forinlinescript' ` +
    `${await url_source(scriptUrlString)}`;
  const metaPolicy = `script-src 'nonce-forinlinescript'`;

  const result = await load_frame(t, get_support_url('metatag', 'iframe',
      metaPolicy, {
        pipe: `header(Content-Security-Policy,${headerPolicy})`,
        script_url: 'externalScript.js',
      }));
  assert_equals(result, 'CSP_VIOLATION');
}, "meta tag can restrict policy set by header");

promise_test(async t => {
  const headerPolicy = `script-src 'nonce-forinlinescript' ` +
    `${await url_source(scriptUrlString)}`;
  const metaPolicy = `script-src 'nonce-forinlinescript' ` +
    `${await url_source(scriptUrlString)} ${await url_source("abc.js")}`;

  const result = await load_frame(t, get_support_url('metatag', 'iframe',
      metaPolicy, {
        pipe: `header(Content-Security-Policy,${headerPolicy})`,
        script_url: 'externalScript.js',
      }));
  assert_equals(result, 'SCRIPT_RAN');
}, "more lax meta tag should still allow script");

promise_test(async t => {
  const metaPolicy1 = `script-src 'nonce-forinlinescript' ` +
    `${await url_source(scriptUrlString)}`;
  const metaPolicy2 = `script-src 'nonce-forinlinescript'`;

  const result = await load_frame(t,
      `support/iframe_meta_multiple.html?${new URLSearchParams({
        pipe: 'sub',
        policy1: metaPolicy1,
        policy2: metaPolicy2,
      })}`);
  assert_equals(result, 'CSP_VIOLATION');
}, "multiple meta tags should apply most strict policy - lax first");

promise_test(async t => {
  const metaPolicy1 = `script-src 'nonce-forinlinescript'`;
  const metaPolicy2 = `script-src 'nonce-forinlinescript' ` +
    `${await url_source(scriptUrlString)}`;

  const result = await load_frame(t,
      `support/iframe_meta_multiple.html?${new URLSearchParams({
        pipe: 'sub',
        policy1: metaPolicy1,
        policy2: metaPolicy2,
      })}`);
  assert_equals(result, 'CSP_VIOLATION');
}, "multiple meta tags should apply most strict policy - strict first");

promise_test(async t => {
  const metaPolicy1 = `script-src 'nonce-forinlinescript' ` +
    `${await url_source(scriptUrlString)} ${await url_source("abc.js")}`;
  const metaPolicy2 = `script-src 'nonce-forinlinescript' ` +
    `${await url_source(scriptUrlString)} ${await url_source("def.js")}`;

  const result = await load_frame(t,
      `support/iframe_meta_multiple.html?${new URLSearchParams({
        pipe: 'sub',
        policy1: metaPolicy1,
        policy2: metaPolicy2,
      })}`);
  assert_equals(result, 'SCRIPT_RAN');
}, "multiple meta tags should apply most strict policy - both lax");
