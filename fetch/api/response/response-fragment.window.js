const expectedURL = new URL("/common/blank.html#test", location).href;
function fragment_test(url, desc) {
  promise_test(() => {
    return fetch(url).then(res => {
      assert_equals(res.url, expectedURL);
    });
  }, "Fetch: " + desc);
  async_test(t => {
    const client = new XMLHttpRequest();
    client.open("GET", url);
    client.send();
    client.onload = t.step_func_done(() => {
      assert_equals(client.responseURL, expectedURL);
    })
  }, "XMLHttpRequest: " + desc);
}

fragment_test("/common/blank.html#test",
              "fragment in request copied over to response");
fragment_test("../resources/redirect.py?omit_parameters&location=/common/blank.html#test",
              "fragment in request copied over during redirect to response");
fragment_test("../resources/redirect.py?omit_parameters&location=/%23test",
              "fragment in redirect copied over to response");
fragment_test("../resources/redirect.py?omit_parameters&location=/%23test#notit",
              "fragment in request overridden by fragment in redirect for response");
