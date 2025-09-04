// META: title=XMLHttpRequest: abort() during DONE (sync only)

async_test(test => {
  const client = new XMLHttpRequest();
  const result = [];
  const expected = [1, 4]; // open() -> 1, send() -> 4

  client.onreadystatechange = test.step_func(() => {
    result.push(client.readyState);
  });

  client.open("GET", "resources/well-formed.xml", false);
  client.send();
  assert_equals(client.readyState, 4);
  assert_equals(client.status, 200);
  assert_equals(client.statusText, "OK");
  assert_equals(client.responseXML.documentElement.localName, "html");
  client.abort();
  assert_equals(client.readyState, 0);
  assert_equals(client.status, 0);
  assert_equals(client.statusText, "");
  assert_equals(client.responseXML, null);
  assert_equals(client.getAllResponseHeaders(), "");
  assert_array_equals(result, expected);
  test.done();
}, "abort() during DONE (sync)");

async_test(test => {
  const client = new XMLHttpRequest();
  const result = [];
  const expected = [1, 4];

  client.onreadystatechange = test.step_func(() => {
    result.push(client.readyState);
    if (client.readyState === 4) {
      assert_equals(client.readyState, 4);
      assert_equals(client.status, 200);
      assert_equals(client.statusText, "OK");
      assert_equals(client.responseXML.documentElement.localName, "html");
      client.abort();
      assert_equals(client.readyState, 0);
      assert_equals(client.status, 0);
      assert_equals(client.statusText, "");
      assert_equals(client.responseXML, null);
      assert_equals(client.getAllResponseHeaders(), "");
      test.done();
    }
  });

  client.open("GET", "resources/well-formed.xml", false);
  client.send();
  assert_equals(client.readyState, 0);
  assert_equals(client.status, 200);
  assert_equals(client.statusText, "OK");
  assert_equals(client.responseXML.documentElement.localName, "html");
}, "abort() during DONE in readystatechange (sync)");
