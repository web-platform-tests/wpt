// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: title=A non-ASCII byte in the winning Path attribute makes the cookie fail to parse

'use strict';

// A cookie's path is a URL path, whose segments are ASCII strings, so a Path
// attribute holding a non-ASCII byte cannot be represented and the cookie fails
// to parse. The check applies to the Path attribute that wins, not to every Path
// attribute seen, matching how the rest of a cookie is validated once parsing
// has settled on its final values.
//
// https://github.com/whatwg/url/issues/814

const DIR = '/cookies/path/resources';
const TARGET = `${DIR}/echo.py`;
// The default path for a cookie set through /cookies/resources/cookie.py.
const DEFAULT_PATH_TARGET = '/cookies/resources/list.py';

// Sets a Set-Cookie header, replacing "ZZ" in `cookie` with the raw bytes given
// as percent-escapes. wptserve percent-decodes the query into bytes and
// cookie.py passes those bytes to the header unchanged, which is how a raw
// non-ASCII byte reaches the Path attribute.
async function setCookieViaHTTP(cookie, rawEscape) {
  let query = encodeURIComponent(JSON.stringify([cookie]));
  if (rawEscape !== undefined) {
    query = query.replace('ZZ', rawEscape);
  }
  const response = await fetch(`/cookies/resources/cookie.py?set=${query}`);
  assert_true(response.ok, 'Setting the cookie via HTTP succeeded');
}

// The Cookie header the server receives for a request to `url`.
async function cookieHeaderAt(url) {
  const response = await fetch(url, {credentials: 'include'});
  assert_true(response.ok, 'Reading the cookies succeeded');
  return (await response.text()).trim();
}

function cookieTest(name, body) {
  promise_test(async t => {
    await test_driver.delete_all_cookies();
    t.add_cleanup(test_driver.delete_all_cookies);
    await body(t);
  }, name);
}

// Control: a later Path attribute overrides an earlier one, which the tests
// below depend on.
cookieTest('A later Path attribute overrides an earlier one', async t => {
  await setCookieViaHTTP(`later=1; Path=${DIR}/nomatch; Path=${DIR}`);
  assert_equals(await cookieHeaderAt(TARGET), 'later=1');
});

// Control: a non-ASCII byte outside the Path attribute is not a parse failure,
// so it is specifically the path that cannot hold one.
cookieTest('A non-ASCII byte in the value is not a parse failure', async t => {
  await setCookieViaHTTP(`value=ZZ; Path=${DIR}`, '%E4%B8%AD');
  assert_true((await cookieHeaderAt(TARGET)).startsWith('value='),
              'The cookie was stored and sent');
});

// A non-ASCII byte in a Path attribute that loses to a later one does not matter,
// because only the winning Path attribute is validated.
cookieTest('A non-ASCII Path attribute followed by a valid one is not a parse failure',
           async t => {
  await setCookieViaHTTP(`losing=1; Path=${DIR}/zzZZ; Path=${DIR}`, '%E4%B8%AD');
  assert_equals(await cookieHeaderAt(TARGET), 'losing=1');
});

// When the non-ASCII Path attribute is the one that wins, the cookie fails to
// parse and nothing is stored.
cookieTest('A non-ASCII byte in the winning Path attribute is a parse failure',
           async t => {
  await setCookieViaHTTP(`winning=1; Path=${DIR}; Path=${DIR}/zzZZ`, '%E4%B8%AD');
  assert_equals(await cookieHeaderAt(TARGET), '');
});

// The cookie must not be sent for a path the non-ASCII bytes were appended to.
// A user agent that truncated the Path at the first non-ASCII byte, or dropped
// the attribute so that the path became "/", would send it here.
cookieTest('A Path attribute with non-ASCII bytes appended does not match that path',
           async t => {
  await setCookieViaHTTP(`appended=1; Path=${DIR}ZZ`, '%E4%B8%AD');
  assert_equals(await cookieHeaderAt(TARGET), '');
});

// Nor may it fall back to the default path, which is what an ignored Path
// attribute would produce.
cookieTest('A non-ASCII Path attribute does not fall back to the default path',
           async t => {
  await setCookieViaHTTP(`fallback=1; Path=${DIR}/zzZZ`, '%E4%B8%AD');
  assert_equals(await cookieHeaderAt(DEFAULT_PATH_TARGET), '{}');
});

// A lone non-ASCII byte is not valid UTF-8 on its own, and is equally rejected.
cookieTest('A lone non-ASCII byte in the winning Path attribute is a parse failure',
           async t => {
  await setCookieViaHTTP(`lone=1; Path=${DIR}/zzZZ`, '%B8');
  assert_equals(await cookieHeaderAt(TARGET), '');
  assert_equals(await cookieHeaderAt(DEFAULT_PATH_TARGET), '{}');
});
