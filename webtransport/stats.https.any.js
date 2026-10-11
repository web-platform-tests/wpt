// META: global=window,worker
// META: script=resources/webtransport-test-helpers.sub.js

function validate_rtt_stats(stats) {
  // The assumption below is that the RTT to localhost is under 5 seconds,
  // which is fairly generous.
  if ("minRtt" in stats) {
    assert_greater_than(stats.minRtt, 0, "minRtt");
    assert_less_than(stats.minRtt, 5 * 1000, "minRtt");
  }
  if ("smoothedRtt" in stats) {
    assert_greater_than(stats.smoothedRtt, 0, "smoothedRtt");
    assert_less_than(stats.smoothedRtt, 5 * 1000, "smoothedRtt");
  }
}

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;
  const stats = await wt.getStats();
  validate_rtt_stats(stats);

  // Check all required fields are present
  assert_greater_than_equal(stats.bytesSent, 0, "bytesSent");
  assert_greater_than_equal(stats.bytesReceived, 0, "bytesReceived");
  assert_greater_than_equal(stats.packetsSent, 0, "packetsSent");
  assert_greater_than_equal(stats.packetsReceived, 0, "packetsReceived");
  assert_greater_than_equal(stats.bytesAcknowledged, 0, "bytesAcknowledged");
  assert_greater_than_equal(stats.bytesLost, 0, "bytesLost");
  assert_greater_than_equal(stats.packetsLost, 0, "packetsLost");
  assert_greater_than_equal(stats.rttVariation, 0, "rttVariation");

  // bytesSentOverhead is omitted: Firefox cannot decompose bytesSent into
  // payload vs. framing/retransmission overhead (see bug 2051624), and the
  // spec requires unavailable stats to be absent from the dictionary.
  assert_equals(stats.bytesSentOverhead, undefined, "bytesSentOverhead");

  // estimatedSendRate can be null or a positive number
  if (stats.estimatedSendRate !== null) {
    assert_greater_than(stats.estimatedSendRate, 0, "estimatedSendRate when not null");
  }

  // atSendCapacity is a boolean
  assert_true(typeof stats.atSendCapacity === 'boolean', "atSendCapacity is boolean");

  // Datagram stats
  if ("expiredOutgoing" in stats.datagrams) {
    assert_equals(stats.datagrams.expiredOutgoing, 0);
  }
  if ("droppedIncoming" in stats.datagrams) {
    assert_equals(stats.datagrams.droppedIncoming, 0);
  }
  if ("lostOutgoing" in stats.datagrams) {
    assert_equals(stats.datagrams.lostOutgoing, 0);
  }
  if ("expiredIncoming" in stats.datagrams) {
    assert_equals(stats.datagrams.expiredIncoming, 0);
  }

  // After connection establishment, we should have sent/received bytes
  assert_greater_than(stats.bytesSent, 0, "Should have sent bytes during handshake");
  assert_greater_than(stats.bytesReceived, 0, "Should have received bytes during handshake");
  assert_greater_than(stats.packetsSent, 0, "Should have sent packets during handshake");
  assert_greater_than(stats.packetsReceived, 0, "Should have received packets during handshake");
}, "WebTransport client should be able to provide stats after connection has been established");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;
  wt.close();

  const stats = await wt.getStats();
  validate_rtt_stats(stats);
}, "WebTransport client should be able to provide stats after connection has been closed");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('server-close.py?code=42'));
  await wt.ready;
  const {closeCode:code} = await wt.closed;
  assert_equals(code, 42);
  wt.close();

  const wt2 = new WebTransport(webtransport_url('server-close.py?code=0'));
  await wt2.ready;
  const {closeCode: code2} = await wt2.closed;
  assert_equals(code2, 0);
  wt2.close();

  // Server closes immediately, so RTT stats may be 0. Handshake bytes are
  // always exchanged though, regardless of close code or timing, so assert
  // strictly greater than 0 rather than the always-true >= 0.
  const stats = await wt.getStats();
  assert_greater_than(stats.bytesSent, 0, "bytesSent should be present");
  assert_greater_than(stats.bytesReceived, 0, "bytesReceived should be present");

  const stats2 = await wt2.getStats();
  assert_greater_than(stats2.bytesSent, 0, "wt2 bytesSent should be present");
  assert_greater_than(stats2.bytesReceived, 0, "wt2 bytesReceived should be present");
}, "WebTransport client should be able to provide stats after server closes connection");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;
  const statsPromise = wt.getStats();
  wt.close();

  const stats = await statsPromise;
  validate_rtt_stats(stats);
}, "WebTransport client should be able to provide stats requested right before connection has been closed");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  // getStats() must return a Promise without throwing, even while CONNECTING.
  const p = wt.getStats();
  assert_true(p instanceof Promise, 'getStats() during CONNECTING must return a Promise');

  // getStats() must not resolve before ready: step 4.1 waits for the connecting
  // state to change (which is when ready resolves) before queueing the resolve.
  const order = [];
  const ready = wt.ready.then(() => { order.push('ready'); });
  const stats = p.then(() => { order.push('stats'); });
  await Promise.all([ready, stats]);
  assert_equals(order[0], 'ready', 'getStats() must not resolve before ready');

  // The promise must resolve with valid stats once the connection is established.
  validate_rtt_stats(await p);
}, 'getStats() during CONNECTING returns a Promise that resolves once connected');

promise_test(async t => {
  const wt = new WebTransport("https://webtransport.invalid/");
  wt.ready.catch(e => {});
  wt.closed.catch(e => {});
  const error = await wt.getStats().catch(e => e);
  assert_equals(error.code, DOMException.INVALID_STATE_ERR);
  const error2 = await wt.getStats().catch(e => e);
  assert_equals(error2.code, DOMException.INVALID_STATE_ERR);
}, "WebTransport client should throw an error when stats are requested for a failed connection");

// Test spec step 4.2: getStats() called while still CONNECTING must reject
// (not resolve) once the connection fails.
promise_test(async t => {
  const wt = new WebTransport(webtransport_url('custom-response.py?:status=404'));
  // Intentionally called before ready, so the transport is CONNECTING.
  const p = wt.getStats();
  assert_true(p instanceof Promise, 'getStats() during CONNECTING must return a Promise');

  // getStats() must reject *after* ready rejects and closed settles: the spec
  // queues the rejection task only once [[State]] has become "failed", which is
  // also when ready/closed settle.
  const order = [];
  const ready = wt.ready.catch(() => { order.push('ready'); });
  const closed = wt.closed.catch(() => { order.push('closed'); });
  const stats = p.catch(() => { order.push('stats'); });
  await Promise.all([ready, closed, stats]);
  assert_equals(order[order.length - 1], 'stats',
                'getStats() must reject after ready and closed settle');

  await promise_rejects_dom(t, 'InvalidStateError', p);
}, 'getStats() called while CONNECTING rejects with InvalidStateError when connection fails');

// Test spec step 3: getStats() called on an already-FAILED transport must
// return a rejected Promise, not throw synchronously.
promise_test(async t => {
  const wt = new WebTransport(webtransport_url('custom-response.py?:status=404'));
  wt.closed.catch(() => {});
  // Wait until the transport has fully transitioned to the FAILED state.
  await wt.ready.catch(() => {});
  // getStats() must return a rejected Promise (not a synchronous throw).
  const p = wt.getStats();
  assert_true(p instanceof Promise, 'getStats() on a FAILED transport must return a Promise');
  await promise_rejects_dom(t, 'InvalidStateError', p);
  // Subsequent calls must also reject consistently.
  await promise_rejects_dom(t, 'InvalidStateError', wt.getStats());
}, 'getStats() on an already-failed transport returns a rejected Promise');

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;
  const stats1 = wt.getStats();
  const stats2 = wt.getStats();
  assert_true(stats1 != stats2, "different promise returned for different getStats() calls");
  validate_rtt_stats(await stats1);
  validate_rtt_stats(await stats2);
}, "WebTransport client should be able to handle multiple concurrent stats requests");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;
  const stats1 = await wt.getStats();
  validate_rtt_stats(stats1);
  const stats2 = await wt.getStats();
  validate_rtt_stats(stats2);
}, "WebTransport client should be able to handle multiple sequential stats requests");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;

  const numDatagrams = 64;
  wt.datagrams.incomingMaxBufferedDatagrams = 4;

  const writer = wt.datagrams.createWritable().getWriter();
  const encoder = new TextEncoder();
  const promises = [];
  while (promises.length < numDatagrams) {
    const token = promises.length.toString();
    promises.push(writer.write(encoder.encode(token)));
  }
  await Promise.all(promises);

  const maxAttempts = 40;
  let stats;
  for (let i = 0; i < maxAttempts; i++) {
    await wait(50);
    stats = await wt.getStats();
    if ("droppedIncoming" in stats.datagrams && stats.datagrams.droppedIncoming > 0) {
      break;
    }
  }
  if ("droppedIncoming" in stats.datagrams) {
    assert_greater_than(stats.datagrams.droppedIncoming, 0);
    assert_less_than_equal(stats.datagrams.droppedIncoming,
                             numDatagrams - wt.datagrams.incomingMaxBufferedDatagrams);
  }
}, "WebTransport client should be able to provide droppedIncoming values for datagrams");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('stats-data-transfer.py'));
  await wt.ready;

  // Get initial stats
  const initialStats = await wt.getStats();

  // Read the data sent by the server to generate traffic
  const reader = wt.incomingBidirectionalStreams.getReader();
  const { value: stream } = await reader.read();
  reader.releaseLock();

  // Read all data from the stream
  const streamReader = stream.readable.getReader();
  let totalBytesRead = 0;
  while (true) {
    const { done, value } = await streamReader.read();
    if (done) break;
    totalBytesRead += value.length;
  }
  streamReader.releaseLock();

  // Verify we actually read the expected data
  assert_greater_than(totalBytesRead, 4000, "Should have read at least 4KB from stream");

  // Send some data back
  const writer = stream.writable.getWriter();
  const testData = new Uint8Array(5000);
  testData.fill(42);
  await writer.write(testData);
  await writer.close();

  // Wait a bit for stats to update
  await wait(50);

  // Get final stats
  const finalStats = await wt.getStats();

  // Verify packet stats increased - packet counts should always increase with activity
  assert_greater_than(finalStats.packetsReceived, initialStats.packetsReceived,
                      "packetsReceived should increase");
  assert_greater_than(finalStats.packetsSent, initialStats.packetsSent,
                      "packetsSent should increase");

  // bytesReceived/bytesSent track transport-level bytes including overhead
  // They may increase by less than application data due to implementation details
  assert_greater_than_equal(finalStats.bytesReceived, initialStats.bytesReceived,
                            "bytesReceived should not decrease");
  assert_greater_than_equal(finalStats.bytesSent, initialStats.bytesSent,
                            "bytesSent should not decrease");

  // BytesAcknowledged should be > 0 (we ACKed packets)
  assert_greater_than(finalStats.bytesAcknowledged, 0,
                      "bytesAcknowledged should be positive after data transfer");

  // bytesSentOverhead is omitted (see the note above the first stats test).
  assert_equals(finalStats.bytesSentOverhead, undefined, "bytesSentOverhead");
}, "WebTransport stats should accurately track data transfer");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;

  const stats1 = await wt.getStats();
  const stats2 = await wt.getStats();

  // Sequential stats calls should show monotonically increasing or equal values
  // (equal if no traffic between calls)
  assert_greater_than_equal(stats2.bytesSent, stats1.bytesSent,
                            "bytesSent should not decrease");
  assert_greater_than_equal(stats2.bytesReceived, stats1.bytesReceived,
                            "bytesReceived should not decrease");
  assert_greater_than_equal(stats2.packetsSent, stats1.packetsSent,
                            "packetsSent should not decrease");
  assert_greater_than_equal(stats2.packetsReceived, stats1.packetsReceived,
                            "packetsReceived should not decrease");
  assert_greater_than_equal(stats2.bytesAcknowledged, stats1.bytesAcknowledged,
                            "bytesAcknowledged should not decrease");
  // bytesLost and packetsLost are not monotonically increasing per spec:
  // packets initially declared lost can subsequently be received.

  // minRtt should not increase (it's the minimum observed)
  assert_less_than_equal(stats2.minRtt, stats1.minRtt,
                         "minRtt should not increase");
}, "WebTransport stats should maintain monotonicity");

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;

  const stats = await wt.getStats();

  // Verify RTT variation is reasonable
  assert_less_than(stats.rttVariation, stats.smoothedRtt * 2,
                   "rttVariation should be < 2x smoothedRtt for stable connection");

  // Verify bytesAcknowledged <= bytesSent (with tolerance for timing)
  // Allow up to 20% slack due to timing of stat collection and packets in flight
  const maxAllowed = stats.bytesSent * 1.2;
  assert_less_than_equal(stats.bytesAcknowledged, maxAllowed,
                         "bytesAcknowledged should not significantly exceed bytesSent");

  // Verify bytesLost <= bytesSent
  assert_less_than_equal(stats.bytesLost, stats.bytesSent,
                         "bytesLost should not exceed bytesSent");

  // Verify packetsLost <= packetsSent
  assert_less_than_equal(stats.packetsLost, stats.packetsSent,
                         "packetsLost should not exceed packetsSent");
}, "WebTransport stats should satisfy invariants");

