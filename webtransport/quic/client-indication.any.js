// META: quic=true
// META: script=/common/get-host-info.sub.js

const PORT = 8983;
const HOST = get_host_info().ORIGINAL_HOST;
const ORIGIN = get_host_info().ORIGIN;
const BASE = `quic-transport://${HOST:${PORT}/handlers`;

promise_test(async (test) => {
  function onClosed() {
    assert_unreached('The closed promise should be ' +
                     'fulfilled or rejected after getting a PASS signal.');
  }
  t = new QuicTransport(`${BASE}/client-indication.quic.py?origin=${ORIGIN}`);
  t.closed.then(test.step_func(onClosed), test.step_func(onClosed));

  const streams = t.receiveStreams();
  let {done, value} = await streams.getReader().read();
  assert_false(done, 'getting an incoming stream');

  const readable = value.readable.pipeThrough(new TextDecoderStream());
  const reader = readable.getReader();
  let result = '';
  while (true) {
    let {done, value} = await reader.read();
    if (done) {
        break;
    }
    result += value;
  }
  assert_equals(result, 'PASS');
}, 'Client indication');
