// META: title=XMLHttpRequest: abort() during LOADING (any.js)

async_test(t => {
  const client = new XMLHttpRequest();
  const result = [];
  const expected = [1, 2, 3, 4]; // open -> 1, HEADERS_RECEIVED -> 2, LOADING -> 3, DONE -> 4

  client.onreadystatechange = t.step_func(() => {
    result.push(client.readyState);

    if (client.readyState === 3) {
      assert_equals(client.status, 200);
      assert_equals(client.statusText, "OK");
      assert_equals(client.responseXML, null);

      client.abort();

      assert_equals(client.readyState, 0);
      assert_equals(client.status, 0);
      assert_equals(client.statusText, "");
      assert_equals(client.responseXML, null);
      assert_equals(client.getAllResponseHeaders(), "");
    }

    if (client.readyState === 4) {
      assert_equals(client.readyState, 4);
      assert_equals(client.status, 0);
      assert_equals(client.statusText, "");
      assert_equals(client.responseXML, null);
      assert_equals(client.getAllResponseHeaders(), "");
    }
  });

  client.onloadend = t.step_func(() => {
    assert_equals(client.readyState, 4);
    assert_equals(client.status, 0);
    assert_equals(client.statusText, "");
    assert_equals(client.responseXML, null);
    assert_equals(client.getAllResponseHeaders(), "");

    t.step_timeout(() => {
      assert_array_equals(result, expected);
      t.done();
    }, 100); // wait a bit in case XHR timeout causes spurious event
  });

  client.open("GET", "resources/well-formed.xml");
  client.send(null);
});
