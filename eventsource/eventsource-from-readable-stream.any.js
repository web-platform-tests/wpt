// META: title=EventSource: fromReadableStream()

// Helper: create a ReadableStream from a string of event-stream data
function streamFromString(str) {
  const bytes = new TextEncoder().encode(str);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    }
  });
}

// Helper: create a ReadableStream that enqueues multiple chunks
function streamFromChunks(chunks) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    }
  });
}

// Helper: create a ReadableStream that errors
function streamThatErrors(error) {
  return new ReadableStream({
    start(controller) {
      controller.error(error);
    }
  });
}

// --- Construction and initial state ---

test(function() {
  const source = EventSource.fromReadableStream(streamFromString(""));
  assert_true(source instanceof EventSource);
  source.close();
}, "fromReadableStream() returns an EventSource instance");

test(function() {
  const source = EventSource.fromReadableStream(streamFromString(""));
  assert_equals(source.readyState, EventSource.CONNECTING);
  source.close();
}, "readyState is CONNECTING immediately after construction");

test(function() {
  const source = EventSource.fromReadableStream(streamFromString(""));
  assert_equals(source.url, "about:event-stream");
  source.close();
}, "url returns about:event-stream");

test(function() {
  const source = EventSource.fromReadableStream(streamFromString(""));
  assert_equals(source.withCredentials, false);
  source.close();
}, "withCredentials returns false");

test(function() {
  const source = EventSource.fromReadableStream(streamFromString(""));
  assert_equals(source.lastEventId, "");
  source.close();
}, "lastEventId initially returns the empty string");

test(function() {
  const source = EventSource.fromReadableStream(streamFromString(""));
  assert_greater_than(source.reconnectionTime, 0);
  source.close();
}, "reconnectionTime initially returns a positive value");

// --- Error conditions ---

test(function() {
  const stream = new ReadableStream();
  stream.getReader(); // locks the stream
  assert_throws_js(TypeError, function() {
    EventSource.fromReadableStream(stream);
  });
}, "throws TypeError if the stream is locked");

// --- open event ---

async_test(function(t) {
  const source = EventSource.fromReadableStream(streamFromString("data: hello\n\n"));
  source.onopen = t.step_func(function(e) {
    assert_equals(e.type, "open");
    assert_equals(source.readyState, EventSource.OPEN);
    source.close();
    t.done();
  });
}, "fires open event");

// --- Receiving messages ---

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("data: hello\n\n")
  );
  source.onmessage = t.step_func(function(e) {
    assert_equals(e.data, "hello");
    source.close();
    t.done();
  });
}, "receives a message event");

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("data: hello\ndata: world\n\n")
  );
  source.onmessage = t.step_func(function(e) {
    assert_equals(e.data, "hello\nworld");
    source.close();
    t.done();
  });
}, "handles multi-line data fields");

async_test(function(t) {
  const count = { value: 0 };
  const source = EventSource.fromReadableStream(
    streamFromString("data: first\n\ndata: second\n\n")
  );
  source.onmessage = t.step_func(function(e) {
    if (count.value === 0) {
      assert_equals(e.data, "first");
    } else if (count.value === 1) {
      assert_equals(e.data, "second");
      source.close();
      t.done();
    }
    count.value++;
  });
}, "receives multiple message events");

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("event: custom\ndata: hello\n\n")
  );
  source.addEventListener("custom", t.step_func(function(e) {
    assert_equals(e.data, "hello");
    source.close();
    t.done();
  }));
}, "handles custom event types");

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString(": this is a comment\ndata: hello\n\n")
  );
  source.onmessage = t.step_func(function(e) {
    assert_equals(e.data, "hello");
    source.close();
    t.done();
  });
}, "ignores comments");

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("data: hello\n\n")
  );
  source.onmessage = t.step_func(function(e) {
    assert_equals(e.origin, "null");
    source.close();
    t.done();
  });
}, "message event origin is 'null' (opaque origin)");

// --- Chunk splitting ---

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromChunks(["da", "ta: hel", "lo\n\n"])
  );
  source.onmessage = t.step_func(function(e) {
    assert_equals(e.data, "hello");
    source.close();
    t.done();
  });
}, "handles data split across chunks");

// --- id and retry fields ---

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("id: 42\ndata: hello\n\n")
  );
  source.onmessage = t.step_func(function(e) {
    assert_equals(e.lastEventId, "42");
    assert_equals(source.lastEventId, "42");
    source.close();
    t.done();
  });
}, "id field updates lastEventId");

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("retry: 5000\ndata: hello\n\n")
  );
  source.onmessage = t.step_func(function(e) {
    assert_equals(source.reconnectionTime, 5000);
    source.close();
    t.done();
  });
}, "retry field updates reconnectionTime");

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("retry: bogus\ndata: hello\n\n")
  );
  var initialTime = source.reconnectionTime;
  source.onmessage = t.step_func(function(e) {
    assert_equals(source.reconnectionTime, initialTime);
    source.close();
    t.done();
  });
}, "retry field with non-digit value is ignored");

// --- close() ---

test(function() {
  const source = EventSource.fromReadableStream(streamFromString("data: hello\n\n"));
  source.close();
  assert_equals(source.readyState, EventSource.CLOSED);
}, "close() sets readyState to CLOSED");

// --- Stream done ---

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("data: hello\n\n")
  );
  let gotMessage = false;
  source.onmessage = t.step_func(function(e) {
    assert_equals(e.data, "hello");
    gotMessage = true;
  });
  source.onerror = t.step_func(function(e) {
    assert_true(gotMessage, "message should be received before error");
    assert_equals(source.readyState, EventSource.CLOSED);
    t.done();
  });
}, "stream done fires error after dispatching complete events");

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("")
  );
  source.onerror = t.step_func(function(e) {
    assert_equals(source.readyState, EventSource.CLOSED);
    t.done();
  });
}, "empty stream fires error and transitions to CLOSED");

// --- Stream error ---

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamThatErrors(new Error("stream error"))
  );
  source.onerror = t.step_func(function(e) {
    assert_equals(source.readyState, EventSource.CLOSED);
    t.done();
  });
}, "stream error fires error event and transitions to CLOSED");

// --- No reconnection ---

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("data: hello\n\n")
  );
  let errorCount = 0;
  source.onerror = t.step_func(function(e) {
    errorCount++;
    assert_equals(source.readyState, EventSource.CLOSED);
    // Wait to verify no reconnection attempt occurs
    t.step_timeout(function() {
      assert_equals(errorCount, 1, "should only get one error event");
      assert_equals(source.readyState, EventSource.CLOSED);
      t.done();
    }, 200);
  });
}, "no reconnection is attempted after stream done");

// --- Newline formats ---

async_test(function(t) {
  const source = EventSource.fromReadableStream(
    streamFromString("data: cr\r\rdata: lf\n\ndata: crlf\r\n\r\n")
  );
  const messages = [];
  source.onmessage = t.step_func(function(e) {
    messages.push(e.data);
    if (messages.length === 3) {
      assert_equals(messages[0], "cr");
      assert_equals(messages[1], "lf");
      assert_equals(messages[2], "crlf");
      source.close();
      t.done();
    }
  });
}, "handles CR, LF, and CRLF line endings");

// --- BOM handling ---

async_test(function(t) {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const data = new TextEncoder().encode("data: hello\n\n");
  const combined = new Uint8Array(bom.length + data.length);
  combined.set(bom);
  combined.set(data, bom.length);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(combined);
      controller.close();
    }
  });
  const source = EventSource.fromReadableStream(stream);
  source.onmessage = t.step_func(function(e) {
    assert_equals(e.data, "hello");
    source.close();
    t.done();
  });
}, "strips leading UTF-8 BOM");

// --- TransformStream reconnection pattern ---

async_test(function(t) {
  const ts = new TransformStream();
  const source = EventSource.fromReadableStream(ts.readable);
  const messages = [];

  source.onmessage = t.step_func(function(e) {
    messages.push(e.data);
    if (messages.length === 2) {
      assert_equals(messages[0], "first");
      assert_equals(messages[1], "second");
      // Close the writable side to end the test
      ts.writable.close();
    }
  });

  source.onerror = t.step_func(function() {
    assert_equals(messages.length, 2);
    t.done();
  });

  // Simulate two "connections" piped through the TransformStream
  const first = streamFromString("data: first\n\n");
  const second = streamFromString("data: second\n\n");

  first.pipeTo(ts.writable, { preventClose: true }).then(function() {
    return second.pipeTo(ts.writable, { preventClose: false });
  });
}, "TransformStream pattern allows multiple streams to be piped through");

async_test(function(t) {
  const ts = new TransformStream();
  const source = EventSource.fromReadableStream(ts.readable);

  source.onmessage = t.step_func(function(e) {
    if (e.data === "after-reconnect") {
      assert_equals(source.lastEventId, "42");
      source.close();
      t.done();
    }
  });

  const first = streamFromString("id: 42\ndata: first\n\n");
  const second = streamFromString("data: after-reconnect\n\n");

  first.pipeTo(ts.writable, { preventClose: true }).then(function() {
    // lastEventId should persist across "reconnections"
    assert_equals(source.lastEventId, "42");
    return second.pipeTo(ts.writable, { preventClose: true });
  });
}, "lastEventId persists across reconnections via TransformStream");

async_test(function(t) {
  const ts = new TransformStream();
  const source = EventSource.fromReadableStream(ts.readable);

  source.onmessage = t.step_func(function(e) {
    if (e.data === "after-reconnect") {
      assert_equals(source.reconnectionTime, 3000);
      source.close();
      t.done();
    }
  });

  const first = streamFromString("retry: 3000\ndata: first\n\n");
  const second = streamFromString("data: after-reconnect\n\n");

  first.pipeTo(ts.writable, { preventClose: true }).then(function() {
    assert_equals(source.reconnectionTime, 3000);
    return second.pipeTo(ts.writable, { preventClose: true });
  });
}, "reconnectionTime persists across reconnections via TransformStream");
