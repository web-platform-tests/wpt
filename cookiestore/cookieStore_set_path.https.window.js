// META: title=Cookie Store API: set()'s path option
// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js

promise_test(async testCase => {
  const currentUrl = new URL(self.location.href);
  const currentPath = currentUrl.pathname;
  await cookieStore.delete({ name: 'cookie-name', path: currentPath });

  await cookieStore.set({ name: 'cookie-name', value: 'cookie-value', path: '' });
  testCase.add_cleanup(async () => {
    await cookieStore.delete({ name: 'cookie-name', path: currentPath });
  });

  const internalCookie = await test_driver.get_named_cookie('cookie-name');
  assert_equals(internalCookie.path, currentPath);
}, 'CookieListItem - cookieStore.set with empty string path defaults to current URL');
