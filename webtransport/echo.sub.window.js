// META: script=/common/get-host-info.sub.js

// TODO(bashi): Run this test on workers as well.

promise_test(async t => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const HOST = get_host_info().ORIGINAL_HOST;
    const PORT = '{{ports[webtransport-h3][0]}}';
    const BASE = `https://${HOST}:${PORT}`;
    const wt = new WebTransport(`${BASE}/echo.py`);
    await wt.ready;

    const stream = await wt.createBidirectionalStream();

    let writer = stream.writable.getWriter();
    await writer.write(encoder.encode("Hello"));
    writer.releaseLock();

    const reader = stream.readable.getReader();
    const { done, value } = await reader.read();
    const reply = decoder.decode(value);

    assert_equals(reply, "Hello");
}, "WebTransport echo should work on a client initiated bidirectional stream");
