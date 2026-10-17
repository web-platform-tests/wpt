// META: global=window,worker
// META: script=/common/get-host-info.sub.js
// META: script=resources/webtransport-test-helpers.sub.js
// META: script=/common/utils.js

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;
  t.add_cleanup(() => wt.close());

  assert_equals(wt.anticipatedConcurrentIncomingUnidirectionalStreams, null,
                'initial uni value should be null');
  assert_equals(wt.anticipatedConcurrentIncomingBidirectionalStreams, null,
                'initial bidi value should be null');

  wt.anticipatedConcurrentIncomingUnidirectionalStreams = 65535;
  assert_equals(wt.anticipatedConcurrentIncomingUnidirectionalStreams, 65535,
                'uni value should be set');

  wt.anticipatedConcurrentIncomingBidirectionalStreams = 65535;
  assert_equals(wt.anticipatedConcurrentIncomingBidirectionalStreams, 65535,
                'bidi value should be set');

  wt.anticipatedConcurrentIncomingUnidirectionalStreams = null;
  assert_equals(wt.anticipatedConcurrentIncomingUnidirectionalStreams, null,
                'uni value should be nullable');

  wt.anticipatedConcurrentIncomingBidirectionalStreams = null;
  assert_equals(wt.anticipatedConcurrentIncomingBidirectionalStreams, null,
                'bidi value should be nullable');
}, 'anticipatedConcurrentIncoming* attributes should be mutable');

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;
  t.add_cleanup(() => wt.close());

  wt.anticipatedConcurrentIncomingUnidirectionalStreams = 0;
  assert_equals(wt.anticipatedConcurrentIncomingUnidirectionalStreams, 0,
                'uni value should accept 0');

  wt.anticipatedConcurrentIncomingBidirectionalStreams = 0;
  assert_equals(wt.anticipatedConcurrentIncomingBidirectionalStreams, 0,
                'bidi value should accept 0');
}, 'anticipatedConcurrentIncoming* attributes should accept 0');

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;
  t.add_cleanup(() => wt.close());

  assert_throws_js(TypeError, () => wt.anticipatedConcurrentIncomingUnidirectionalStreams = -1,
                   'should throw TypeError on negative anticipated streams');
  assert_throws_js(TypeError, () => wt.anticipatedConcurrentIncomingBidirectionalStreams = -1,
                   'should throw TypeError on netative anticipated streams');
  assert_throws_js(TypeError, () => wt.anticipatedConcurrentIncomingUnidirectionalStreams = 65536,
                   'should throw TypeError on max+1 anticipated streams');
  assert_throws_js(TypeError, () => wt.anticipatedConcurrentIncomingBidirectionalStreams = 65536,
                   'should throw TypeError on max+1 anticipated streams');
}, 'anticipatedConcurrentIncoming* attributes should throw on invalid u16 values');

promise_test(async t => {
  const wt = new WebTransport(webtransport_url('echo.py'));
  await wt.ready;

  wt.anticipatedConcurrentIncomingUnidirectionalStreams = 100;
  wt.anticipatedConcurrentIncomingBidirectionalStreams = 50;

  wt.close();
  await wt.closed;

  assert_equals(wt.anticipatedConcurrentIncomingUnidirectionalStreams, 100,
                'values should persist after close');
  assert_equals(wt.anticipatedConcurrentIncomingBidirectionalStreams, 50,
                'values should persist after close');
}, 'anticipatedConcurrentIncoming* attributes should persist after session close');
