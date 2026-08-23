// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: title=Cookie Path attribute matching only at path segment boundaries

'use strict';

// A cookie is only sent when its path is the request URL's path, or a prefix of
// it that ends at a path segment boundary. In particular a cookie path that is
// longer than the request URL's path never matches, even when the request URL's
// path is a prefix of it.
//
// https://httpwg.org/http-extensions/draft-ietf-httpbis-layered-cookies.html#store-a-cookie

const DIR = '/cookies/path/resources';
const TARGET = `${DIR}/echo.py`;

async function setCookieViaHTTP(cookie) {
  const set = encodeURIComponent(JSON.stringify([cookie]));
  const response = await fetch(`/cookies/resources/cookie.py?set=${set}`);
  assert_true(response.ok, 'Setting the cookie via HTTP succeeded');
}

// The Cookie header the server receives for a request to TARGET.
async function cookieHeaderAtTarget() {
  const response = await fetch(TARGET, {credentials: 'include'});
  assert_true(response.ok, 'Reading the Cookie header succeeded');
  return (await response.text()).trim();
}

// Each test uses a cookie name of its own and clears the whole jar, so a cookie
// stored under an unexpected path cannot leak into the next test.
function pathTest({name, cookieName, path, expected}) {
  promise_test(async t => {
    await test_driver.delete_all_cookies();
    t.add_cleanup(test_driver.delete_all_cookies);

    await setCookieViaHTTP(`${cookieName}=1; Path=${path}`);
    assert_equals(await cookieHeaderAtTarget(), expected);
  }, name);
}

pathTest({
  name: 'A Path equal to the request path matches',
  cookieName: 'exact',
  path: TARGET,
  expected: 'exact=1',
});

pathTest({
  name: 'A Path that is a prefix ending at a segment boundary matches',
  cookieName: 'prefix',
  path: DIR,
  expected: 'prefix=1',
});

pathTest({
  name: 'A Path that is a prefix ending in a slash matches',
  cookieName: 'trailingslash',
  path: `${DIR}/`,
  expected: 'trailingslash=1',
});

// The request path continues with ".py" rather than a "/", so the cookie path is
// not a prefix ending at a segment boundary.
pathTest({
  name: 'A Path that is a prefix not ending at a segment boundary does not match',
  cookieName: 'midsegment',
  path: `${DIR}/echo`,
  expected: '',
});

// The request path is a prefix of the cookie path rather than the other way
// around. A cookie path longer than the request path can never match.
pathTest({
  name: 'A Path that is the request path followed by a slash does not match',
  cookieName: 'longerslash',
  path: `${TARGET}/`,
  expected: '',
});

pathTest({
  name: 'A Path that is the request path followed by a segment does not match',
  cookieName: 'longersegment',
  path: `${TARGET}/sub`,
  expected: '',
});
