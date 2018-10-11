[
  ["content-length", "0", "header-content-length"],
  ["double-trouble", "", "headers-double-empty"],
  ["foo-test", "1, 2, 3", "headers-basic"],
  ["heya", "1, 2", "headers-some-are-empty"],
  ["www-authenticate", "1, 2, 3, 4", "headers-www-authenticate"],
].forEach(testValues => {
  async_test(t => {
    const client = new XMLHttpRequest();
    client.onload = t.step_func_done(() => {
      assert_equals(client.getResponseHeader(testValues[0]), testValues[1]);
    });
    client.onerror = t.unreached_func("unexpected error");
    client.open("GET", "resources/" + testValues[2] + ".asis");
    client.send();
  }, "getResponseHeader('" + testValues[0] + "')");
});
