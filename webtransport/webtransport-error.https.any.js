// META: global=window,worker

test(t => {
  // streamErrorCode is unsigned long (0-4294967295), not just a byte value.
  const e = new WebTransportError('', {streamErrorCode: 70000});
  assert_equals(e.streamErrorCode, 70000);
}, 'WebTransportError streamErrorCode accepts values above 255');

test(t => {
  const e = new WebTransportError();
  assert_equals(e.streamErrorCode, null);
}, 'WebTransportError streamErrorCode defaults to null');

test(t => {
  const e = new WebTransportError('', {streamErrorCode: 4294967295});
  assert_equals(e.streamErrorCode, 4294967295);
}, 'WebTransportError streamErrorCode accepts the maximum unsigned long value');

test(t => {
  const e = new WebTransportError();
  assert_equals(e.source, 'stream');
}, 'WebTransportError source defaults to "stream"');

test(t => {
  const e = new WebTransportError('', {source: 'session'});
  assert_equals(e.source, 'session');
}, 'WebTransportError source accepts "session"');

test(t => {
  const e = new WebTransportError('boom');
  assert_equals(e.message, 'boom');
}, 'WebTransportError message is settable via the first constructor argument');

test(t => {
  const e = new WebTransportError('boom', {source: 'session', streamErrorCode: 70000});
  const clone = structuredClone(e);
  assert_true(clone instanceof WebTransportError, 'instanceof');
  assert_equals(clone.name, 'WebTransportError', 'name');
  assert_equals(clone.message, 'boom', 'message');
  assert_equals(clone.source, 'session', 'source');
  assert_equals(clone.streamErrorCode, 70000, 'streamErrorCode');
}, 'WebTransportError is serializable');

test(t => {
  const clone = structuredClone(new WebTransportError());
  assert_equals(clone.message, '', 'message');
  assert_equals(clone.source, 'stream', 'source');
  assert_equals(clone.streamErrorCode, null, 'streamErrorCode');
}, 'WebTransportError serialization preserves a null streamErrorCode');

test(t => {
  const clone = structuredClone(new WebTransportError('', {streamErrorCode: 0}));
  assert_equals(clone.streamErrorCode, 0);
}, 'WebTransportError serialization distinguishes streamErrorCode 0 from null');
