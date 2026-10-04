// META: global=window,worker
// META: script=resources/webtransport-test-helpers.sub.js

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('sendorder-scheduling.py'));
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
