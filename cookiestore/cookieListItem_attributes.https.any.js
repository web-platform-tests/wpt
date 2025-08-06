// META: title=Cookie Store API: cookieListItem attributes
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: global=window

'use strict';

const kCurrentHostname = (new URL(self.location.href)).hostname;

const kOneDay = 24 * 60 * 60 * 1000;
const kFourHundredDays = 400 * kOneDay;
const kTenYears = 10 * 365 * kOneDay;
const kFourHundredDaysFromNow = Date.now() + kFourHundredDays;
const kTenYearsFromNow = Date.now() + kTenYears;

function assert_cookie_keys(cookie) {
  const cookieKeys = Object.keys(cookie);
  assert_array_equals(cookieKeys, ['name', 'value']);
}

promise_test(async testCase => {
  await cookieStore.delete('cookie-name');

  await cookieStore.set('cookie-name', 'cookie-value');
  testCase.add_cleanup(async () => {
    await cookieStore.delete('cookie-name');
  });

  const cookie = await cookieStore.get('cookie-name');
  assert_equals(cookie.name, 'cookie-name');
  assert_equals(cookie.value, 'cookie-value');
  assert_cookie_keys(cookie);

  const internalCookie = await test_driver.get_named_cookie('cookie-name');
  assert_equals(internalCookie.name, 'cookie-name');
  assert_equals(internalCookie.value, 'cookie-value');
  assert_equals(internalCookie.path, '/');
  // I'm not sure how to translate WebDriver domain to what we expect here.
  // assert_equals(internalCookie.domain, '');
  assert_true(internalCookie.secure);
  assert_false(internalCookie.httpOnly);
  assert_equals(internalCookie.expiry, undefined);
  assert_equals(internalCookie.sameSite, 'Strict');
}, 'CookieListItem - cookieStore.set defaults with positional name and value');

promise_test(async testCase => {
  await cookieStore.delete('cookie-name');

  await cookieStore.set({ name: 'cookie-name', value: 'cookie-value' });
  testCase.add_cleanup(async () => {
    await cookieStore.delete('cookie-name');
  });
  const cookie = await cookieStore.get('cookie-name');
  assert_equals(cookie.name, 'cookie-name');
  assert_equals(cookie.value, 'cookie-value');
  assert_cookie_keys(cookie);

  const internalCookie = await test_driver.get_named_cookie('cookie-name');
  assert_equals(internalCookie.name, 'cookie-name');
  assert_equals(internalCookie.value, 'cookie-value');
  assert_equals(internalCookie.path, '/');
  // I'm not sure how to translate WebDriver domain to what we expect here.
  // assert_equals(internalCookie.domain, '');
  assert_true(internalCookie.secure);
  assert_false(internalCookie.httpOnly);
  assert_equals(internalCookie.expiry, undefined);
  assert_equals(internalCookie.sameSite, 'Strict');
}, 'CookieListItem - cookieStore.set defaults with name and value in options');

promise_test(async testCase => {
  await cookieStore.delete('cookie-name');

  await cookieStore.set({ name: 'cookie-name', value: 'cookie-value',
                          expires: kTenYearsFromNow });
  testCase.add_cleanup(async () => {
    await cookieStore.delete('cookie-name');
  });
  const cookie = await cookieStore.get('cookie-name');
  assert_equals(cookie.name, 'cookie-name');
  assert_equals(cookie.value, 'cookie-value');
  assert_cookie_keys(cookie);

  const internalCookie = await test_driver.get_named_cookie('cookie-name');
  assert_approx_equals(internalCookie.expiry, kFourHundredDaysFromNow, kOneDay);
}, 'CookieListItem - cookieStore.set with expires set to a timestamp 10 ' +
   'years in the future');

promise_test(async testCase => {
  await cookieStore.delete('cookie-name');

  await cookieStore.set({ name: 'cookie-name', value: 'cookie-value',
                          expires: new Date(kTenYearsFromNow) });
  testCase.add_cleanup(async () => {
    await cookieStore.delete('cookie-name');
  });
  const cookie = await cookieStore.get('cookie-name');
  assert_equals(cookie.name, 'cookie-name');
  assert_equals(cookie.value, 'cookie-value');
  assert_cookie_keys(cookie);

  const internalCookie = await test_driver.get_named_cookie('cookie-name');
  assert_approx_equals(internalCookie.expiry, kFourHundredDaysFromNow, kOneDay);
}, 'CookieListItem - cookieStore.set with expires set to a Date 10 ' +
   'years in the future');

promise_test(async testCase => {
  await cookieStore.delete({ name: 'cookie-name', domain: kCurrentHostname });

  await cookieStore.set({ name: 'cookie-name', value: 'cookie-value',
                          domain: kCurrentHostname });
  testCase.add_cleanup(async () => {
    await cookieStore.delete({ name: 'cookie-name', domain: kCurrentHostname });
  });
  const cookie = await cookieStore.get('cookie-name');
  assert_equals(cookie.name, 'cookie-name');
  assert_equals(cookie.value, 'cookie-value');
  assert_cookie_keys(cookie);

  const internalCookie = await test_driver.get_named_cookie('cookie-name');
  assert_equals(internalCookie.domain, kCurrentHostname);
}, 'CookieListItem - cookieStore.set with domain set to the current hostname');

promise_test(async testCase => {
  const currentUrl = new URL(self.location.href);
  const currentPath = currentUrl.pathname;
  const currentDirectory =
      currentPath.substr(0, currentPath.lastIndexOf('/') + 1);
  await cookieStore.delete({ name: 'cookie-name', path: currentDirectory });

  await cookieStore.set({ name: 'cookie-name', value: 'cookie-value',
                          path: currentDirectory });
  testCase.add_cleanup(async () => {
    await cookieStore.delete({ name: 'cookie-name', path: currentDirectory });
  });
  const cookie = await cookieStore.get('cookie-name');
  assert_equals(cookie.name, 'cookie-name');
  assert_equals(cookie.value, 'cookie-value');
  assert_cookie_keys(cookie);

  const internalCookie = await test_driver.get_named_cookie('cookie-name');
  assert_equals(internalCookie.path, currentDirectory);

}, 'CookieListItem - cookieStore.set with path set to the current directory');

promise_test(async testCase => {
  const currentUrl = new URL(self.location.href);
  const currentPath = currentUrl.pathname;
  const currentDirectory = currentPath.substr(0, currentPath.lastIndexOf('/'));
  await cookieStore.delete({ name: 'cookie-name', path: currentDirectory });

  await cookieStore.set({ name: 'cookie-name', value: 'cookie-value',
                          path: currentDirectory });
  testCase.add_cleanup(async () => {
    await cookieStore.delete({ name: 'cookie-name', path: currentDirectory });
  });
  const cookie = await cookieStore.get('cookie-name');
  assert_equals(cookie.name, 'cookie-name');
  assert_equals(cookie.value, 'cookie-value');
  assert_cookie_keys(cookie);

  const internalCookie = await test_driver.get_named_cookie('cookie-name');
  assert_equals(internalCookie.path, currentDirectory);
}, 'CookieListItem - cookieStore.set does not add / to path if it does not end with /');

['strict', 'lax', 'none'].forEach(sameSiteValue => {
  promise_test(async testCase => {
    await cookieStore.delete('cookie-name');

    await cookieStore.set({
        name: 'cookie-name', value: 'cookie-value', sameSite: sameSiteValue });
    testCase.add_cleanup(async () => {
      await cookieStore.delete('cookie-name');
    });
    const cookie = await cookieStore.get('cookie-name');
    assert_equals(cookie.name, 'cookie-name');
    assert_equals(cookie.value, 'cookie-value');
    assert_cookie_keys(cookie);

    const internalCookie = await test_driver.get_named_cookie('cookie-name');
    assert_equals(internalCookie.sameSite, sameSiteValue.charAt(0).toUpperCase() + sameSiteValue.slice(1));
  }, `CookieListItem - cookieStore.set with sameSite set to ${sameSiteValue}`);

});

if (self.GLOBAL.isWindow()) {
  promise_test(async testCase => {
    await cookieStore.delete('cookie-name');
    testCase.add_cleanup(async () => {
      await cookieStore.delete('cookie-name');
    });

    let encodedCookie = encodeURIComponent(JSON.stringify("cookie-name=1; max-age=99999999999999999999999999999; path=/"));
    await fetch(`/cookies/resources/cookie.py?set=${encodedCookie}`);

    assert_equals(document.cookie, "cookie-name=1", 'The cookie was set as expected.');

    const cookie = await cookieStore.get('cookie-name');
    assert_equals(cookie.name, 'cookie-name');
    assert_equals(cookie.value, '1');
    assert_cookie_keys(cookie);

    const internalCookie = await test_driver.get_named_cookie('cookie-name');
    assert_approx_equals(internalCookie.expiry, kFourHundredDaysFromNow, kOneDay);
  }, "Test max-age attribute over the 400 days");
}
