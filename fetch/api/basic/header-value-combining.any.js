// META: global=window,worker

[
  ["content-length", "0", "header-content-length"],
  ["double-trouble", "", "headers-double-empty"],
  ["foo-test", "1, 2, 3", "headers-basic"],
  ["heya", "1, 2", "headers-some-are-empty"],
  ["www-authenticate", "1, 2, 3, 4", "headers-www-authenticate"],
].forEach(testValues => {
  promise_test(async t => {
    const response = await fetch("../../../xhr/resources/" + testValues[2] + ".asis");
    assert_equals(response.headers.get(testValues[0]), testValues[1]);
  }, "response.headers.get('" + testValues[0] + "')");
});
