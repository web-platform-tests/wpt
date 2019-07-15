// META: script=resources/test-helpers.js
test(() => {
  assert_true(!!window.launchParams);
  assert_equals(window.launchParams.request, null);

  // Files should default to an empty array.
  assert_true(!!window.launchParams.files);
  assert_equals(window.launchParams.files.length, 0);
});