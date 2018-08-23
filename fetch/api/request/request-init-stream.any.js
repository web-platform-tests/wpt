// META: global=window,worker

"use strict";

function assert_request(input, init) {
  assert_throws(new TypeError(), () => new Request(input, init), "new Request()");
  assert_throws(new TypeError(), () => fetch(input, init), "fetch()");
}

test(() => {
  const stream = new ReadableStream();
  stream.getReader();
  assert_request("...", { method:"POST", body: stream });
}, "Constructing a Request with a stream on which getReader() is called");

test(() => {
  const stream = new ReadableStream();
  stream.getReader().read();
  assert_request("...", { method:"POST", body: stream });
}, "Constructing a Request with a stream on which read() is called");

promise_test(async () => {
  const stream = new ReadableStream({ pull: c => c.enqueue(new Uint8Array()) }),
        reader = stream.getReader();
  await reader.read();
  reader.releaseLock();
  assert_request("...", { method:"POST", body: stream });
}, "Constructing a Request with a stream on which read() and releaseLock() are called");

test(() => {
  const request = new Request("...", { method: "POST", body: "..." });
  request.body.getReader();
  assert_request(request);
  assert_class_string(new Request(request, { body: "..." }), "Request");
}, "Constructing a Request with a Request on which body.getReader() is called");

test(() => {
  const request = new Request("...", { method: "POST", body: "..." });
  request.body.getReader().read();
  assert_request(request);
  assert_class_string(new Request(request, { body: "..." }), "Request");
}, "Constructing a Request with a Request on which body.getReader().read() is called");

promise_test(async () => {
  const request = new Request("...", { method: "POST", body: "..." }),
        reader = request.body.getReader();
  await reader.read();
  reader.releaseLock();
  assert_request(request);
  assert_class_string(new Request(request, { body: "..." }), "Request");
}, "Constructing a Request with a Request on which read() and releaseLock() are called");
