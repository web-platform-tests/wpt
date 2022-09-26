// META: title=Cookie Store API: Interaction between cookieStore.set() and cookieStore.delete()
// META: global=window,serviceworker

'use strict';

promise_test(async testCase => {
  await cookieStore.set('cookie-name', 'cookie-value');
  testCase.add_cleanup(async () => {
     await cookieStore.delete('cookie-name');
  });
  await cookieStore.delete('cookie-name');
  const cookie = await cookieStore.get('cookie-name');
  assert_equals(cookie, undefined);
}, 'cookieStore.get returns undefined for a cookie deleted by cookieStore.delete');
