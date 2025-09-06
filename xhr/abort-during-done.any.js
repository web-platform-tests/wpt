// META: title=XMLHttpRequest: abort() during DONE (async)

async_test(t => {
  const client = new XMLHttpRequest();
  const result = [];
  const expected = [1, 2, 3, 4]; // open -> 1, headers -> 2, loading -> 3, done -> 4

  client.onreadystatechange = t.step_func(() => {
    result.push(client.readyState);

    if (client.readyState === 4) {
      assert_equals(client.readyState, 4);
      assert_equals(client.status, 200);
      assert_equals(client.responseXML.documentElement.localName, "html");

      client.abort();

      assert_equals(client.readyState, 0);
      assert_equals(client.status, 0);
      assert_equals(client.statusText, "");
      assert_equals(client.responseXML, null);
      assert_equals(client.getAllResponseHeaders(), "");

      // Small delay in case XHR timeout causes spurious events
      t.step_timeout(() => {
        assert_array_equals(result, expected);
        t.done();
      }, 100);
    }
  });

  client.open("GET", "resources/well-formed.xml");
  client.send();
}, "abort() during DONE (async)");
