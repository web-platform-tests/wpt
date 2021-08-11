// META: global=window,worker
// META: script=/common/get-host-info.sub.js

const HOST = get_host_info().ORIGINAL_HOST;
// TODO(bashi): Use port substitutions once the WebTransport server is enabled.
const PORT = '11000';
const BASE = `https://${HOST}:${PORT}`;

promise_test(async t => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const wt = new WebTransport(`${BASE}/webtransport/handlers/echo.py`);
    await wt.ready;

    const stream = await wt.createBidirectionalStream();

    const writer = stream.writable.getWriter();
    await writer.write(encoder.encode("Hello"));
    writer.releaseLock();

    const reader = stream.readable.getReader();
    const { done, value } = await reader.read();
    const reply = decoder.decode(value);

    assert_equals(reply, "Hello");
}, "WebTransport server should be running and should handle a bidirectional stream");
