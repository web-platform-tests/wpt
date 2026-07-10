// META: global=window,worker
// META: script=resources/webtransport-test-helpers.sub.js
// META: script=/common/utils.js


promise_test(async t => {
  // Establish a WebTransport session.
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;

  // Create a bidirectional stream with sendorder
  const {readable, writable} = await wt.createBidirectionalStream({sendOrder: 3});
  assert_equals(writable.sendOrder, 3);

  // Write a message to the writable end, and close it.
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  writer.write(encoder.encode('Hello World')).catch(() => {});
  await writer.close();

  // Read the data on the readable end.
  const reply = await read_stream_as_string(readable);

  // Check that the message from the readable end matches the writable end.
  assert_equals(reply, 'Hello World');
}, 'WebTransport client should be able to create and handle a bidirectional stream with sendOrder');

promise_test(async t => {
  // Establish a WebTransport session.
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;

  // Create a bidirectional stream with sendorder
  const {readable, writable} = await wt.createBidirectionalStream();
  assert_equals(writable.sendOrder, 0);
  // modify it
  writable.sendOrder = 4;
  assert_equals(writable.sendOrder, 4);
  // Test null coercion: long long converts null via ToNumber(null) = +0
  writable.sendOrder = null;
  assert_equals(writable.sendOrder, 0);
}, 'WebTransport client should be able to modify unset sendOrder after stream creation');

promise_test(async t => {
  // Establish a WebTransport session.
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;

    // Create a bidirectional stream without sendorder
  const {readable, writable} = await wt.createBidirectionalStream({sendOrder: 3});
  assert_equals(writable.sendOrder, 3);
  // modify it
  writable.sendOrder = 5;
  assert_equals(writable.sendOrder, 5);
  writable.sendOrder = 0;
  assert_equals(writable.sendOrder, 0);
  // Note: this doesn't verify the underlying stack actually changes priority, just the API
  // for controlling sendOrder
}, 'WebTransport client should be able to modify existing sendOrder after stream creation');

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('sendorder.py'));
  t.add_cleanup(() => wt.close());
  await wt.ready;

  const data_size = 10 * 1024 * 1024;
  const low_marker = 1;
  const high_marker = 2;
  const low_data = new Uint8Array(data_size).fill(low_marker);
  const high_data = new Uint8Array(data_size).fill(high_marker);

  const [low_stream, high_stream] = await Promise.all([
    wt.createBidirectionalStream({sendOrder: 1}),
    wt.createBidirectionalStream({sendOrder: 2}),
  ]);
  const low_writer = low_stream.writable.getWriter();
  const high_writer = high_stream.writable.getWriter();

  const low_done = Promise.all([
    low_writer.write(low_data),
    low_writer.close(),
  ]);
  const high_done = Promise.all([
    high_writer.write(high_data),
    high_writer.close(),
  ]);

  // The server replies on each stream when that stream is fully received. Its
  // reply is a snapshot of the bytes received on all streams at that point.
  const counts = await read_stream_as_json(high_stream.readable);
  await Promise.all([low_done, high_done]);

  assert_equals(counts[high_marker], data_size,
                'the high-order stream should be fully received');
  assert_less_than(counts[low_marker] || 0, data_size / 2,
                   'the low-order stream should remain mostly queued');
}, 'WebTransport should send queued bytes on a higher sendOrder stream first');
