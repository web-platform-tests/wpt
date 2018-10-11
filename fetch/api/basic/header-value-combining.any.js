// META: global=window,worker

promise_test(async t => {
  const response = await fetch("../../../xhr/resources/headers-basic.asis");
  assert_equals(response.headers.get("foo-test"), "1, 2, 3");
}, "response.headers.get('foo-test')");

promise_test(async t => {
  const response = await fetch("../../../xhr/resources/headers-www-authenticate.asis");
  assert_equals(response.headers.get("www-authenticate"), "1, 2, 3, 4");
}, "response.headers.get('www-authenticate')");

promise_test(async t => {
  const response = await fetch("../../../xhr/resources/headers-some-are-empty.asis");
  assert_equals(response.headers.get("heya"), "1, 2");
}, "response.headers.get('heya')");
