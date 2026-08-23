// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: title=Overwriting a cookie's value while its attributes stay the same
// META: timeout=long

'use strict';

// https://httpwg.org/http-extensions/draft-ietf-httpbis-layered-cookies.html#store-a-cookie
// https://github.com/httpwg/http-extensions/issues/3501

// A fixed expiry date, so that a cookie and the cookie overwriting it have an
// identical expiry time no matter when they are set.
const kExpires = 'Expires=Fri, 01 Jan 2100 00:00:00 GMT';

async function setCookiesViaHTTP(cookies) {
  const set = encodeURIComponent(JSON.stringify(cookies));
  const response = await fetch(`/cookies/resources/cookie.py?set=${set}`);
  assert_true(response.ok, 'Setting cookies via HTTP succeeded');
}

// Reads the cookie store from the server's point of view, which unlike
// document.cookie also observes HttpOnly cookies.
async function getCookiesViaHTTP() {
  const response = await fetch('/cookies/resources/list.py');
  assert_true(response.ok, 'Reading cookies via HTTP succeeded');
  return response.json();
}

// Sets each cookie of `cookies` in order and then asserts that the server
// observes `expected`, a name to value mapping.
//
// `separateResponses` controls whether each cookie is sent in a response of its
// own, as opposed to all of them being sent in a single response.
function overwriteTest({cookies, expected, name, separateResponses = true}) {
  promise_test(async t => {
    await test_driver.delete_all_cookies();
    t.add_cleanup(test_driver.delete_all_cookies);

    if (separateResponses) {
      for (const cookie of cookies) {
        await setCookiesViaHTTP([cookie]);
      }
    } else {
      await setCookiesViaHTTP(cookies);
    }

    assert_object_equals(await getCookiesViaHTTP(), expected);
  }, name);
}

// Each of these attribute strings results in a cookie whose secure, same-site,
// expiry-time, and http-only are identical to those of the cookie it overwrites,
// leaving the value as the only difference.
const attributeSets = [
  'Path=/',
  'Path=/; Secure',
  'Path=/; HttpOnly',
  'Path=/; SameSite=Strict',
  'Path=/; SameSite=Lax',
  'Path=/; SameSite=None; Secure',
  `Path=/; ${kExpires}`,
  `Path=/; Secure; HttpOnly; SameSite=Strict; ${kExpires}`,
];

for (const attributes of attributeSets) {
  overwriteTest({
    cookies: [`test=1; ${attributes}`, `test=2; ${attributes}`],
    expected: {test: '2'},
    name: `Overwrite value via separate responses with '${attributes}'`,
  });

  overwriteTest({
    cookies: [`test=1; ${attributes}`, `test=2; ${attributes}`],
    expected: {test: '2'},
    name: `Overwrite value via a single response with '${attributes}'`,
    separateResponses: false,
  });
}

// Max-Age is relative to when the cookie is received, so only cookies received
// in the same response are guaranteed an identical expiry time.
overwriteTest({
  cookies: ['test=1; Path=/; Max-Age=1000', 'test=2; Path=/; Max-Age=1000'],
  expected: {test: '2'},
  name: "Overwrite value via a single response with 'Path=/; Max-Age=1000'",
  separateResponses: false,
});

// Overwriting a value with the empty value is a change as well.
overwriteTest({
  cookies: ['test=1; Path=/', 'test=; Path=/'],
  expected: {test: ''},
  name: 'Overwrite value with the empty value',
});

// And so is overwriting the empty value with a value.
overwriteTest({
  cookies: ['test=; Path=/', 'test=1; Path=/'],
  expected: {test: '1'},
  name: 'Overwrite the empty value with a value',
});

// The equivalent of the above via a non-HTTP API. HttpOnly is excluded as it
// cannot be set through document.cookie.
for (const attributes of attributeSets.filter(a => !a.includes('HttpOnly'))) {
  promise_test(async t => {
    await test_driver.delete_all_cookies();
    t.add_cleanup(test_driver.delete_all_cookies);

    document.cookie = `test=1; ${attributes}`;
    document.cookie = `test=2; ${attributes}`;

    assert_equals(document.cookie, 'test=2');
  }, `Overwrite value via document.cookie with '${attributes}'`);
}
