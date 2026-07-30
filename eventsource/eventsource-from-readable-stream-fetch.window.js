// META: title=EventSource: fromReadableStream() with fetch()

async_test(function(t) {
  fetch("resources/message.py").then(t.step_func(function(response) {
    const source = EventSource.fromReadableStream(response.body);
    source.onmessage = t.step_func(function(e) {
      assert_equals(e.data, "data");
      source.close();
      t.done();
    });
  }));
}, "works with a fetch() response body");

async_test(function(t) {
  fetch("resources/message.py?message=id%3A%2042%0Aretry%3A%205000%0Adata%3A%20hello").then(
    t.step_func(function(response) {
      const source = EventSource.fromReadableStream(response.body);
      source.onmessage = t.step_func(function(e) {
        assert_equals(e.data, "hello");
        assert_equals(source.lastEventId, "42");
        assert_equals(source.reconnectionTime, 5000);
        source.close();
        t.done();
      });
    })
  );
}, "lastEventId and reconnectionTime work with fetch() response");
