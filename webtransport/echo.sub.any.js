// META: global=window,worker
// META: script=/common/get-host-info.sub.js

const HOST = get_host_info().ORIGINAL_HOST;
const PORT = '{{ports[webtransport-h3][0]}}';
const BASE = `https://${HOST}:${PORT}`;

// TODO(bashi): Figure out why connections sometimes lost.
async function create_webtransport(t) {
    const RETRY_COUNT = 3;
    const RETRY_DELAY_MS = 500;
    for (let i = 0; i < RETRY_COUNT; i++) {
        let wt = new WebTransport(`${BASE}/echo.py`);
        let success = await wt.ready.then(_ => true).catch(_ => false);
        if (success) {
            return wt;
        }
        // `closed` is also rejected.
        wt.closed.catch(_ => { });
        await new Promise(resolve => t.step_timeout(resolve, RETRY_DELAY_MS));
    }
    return Promise.reject("Failed to create WebTransport connection");
}

promise_test(async t => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const wt = await create_webtransport(t);

    const stream = await wt.createBidirectionalStream();

    const writer = stream.writable.getWriter();
    await writer.write(encoder.encode("Hello"));
    writer.releaseLock();

    const reader = stream.readable.getReader();
    const { done, value } = await reader.read();
    const reply = decoder.decode(value);

    assert_equals(reply, "Hello");
}, "WebTransport echo should work on a client initiated bidirectional stream");
