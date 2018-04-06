importScripts('/resources/testharness.js');

setup({
  explicit_done: true
});

function assert_range_request(request, expectedRangeHeader, name) {
  assert_equals(request.headers.get('Range'), expectedRangeHeader, name);
}

let gotRangeResponse = false;

addEventListener('fetch', event => {
  const { request } = event;

  if (!request.headers.has('Range') || gotRangeResponse) return;
  gotRangeResponse = true;

  const rangeValue = request.headers.get('Range');

  test(() => {
    assert_range_request(new Request(request), rangeValue, `Untampered`);
    assert_range_request(new Request(request, {}), rangeValue, `Untampered (no init props set)`);
    assert_range_request(new Request(request, { __foo: 'bar' }), rangeValue, `Untampered (only invalid props set)`);
    assert_range_request(new Request(request, { move: 'cors' }), rangeValue, `More permissive mode`);
    assert_range_request(request.clone(), rangeValue, `Clone`);
  }, "Range headers correctly preserved");

  test(() => {
    assert_range_request(new Request(request, { headers: { Range: 'foo' } }), null, `Tampered - range header set`);
    assert_range_request(new Request(request, { headers: {} }), null, `Tampered - empty headers set`);
    assert_range_request(new Request(request, { mode: 'no-cors' }), null, `Tampered – mode set`);
    assert_range_request(new Request(request, { cache: 'no-cache' }), null, `Tampered – cache mode set`);
  }, "Range headers correctly removed");

  test(() => {
    let headers;

    headers = new Request(request).headers;
    headers.delete('does-not-exist');
    assert_equals(header.get('Range'), rangeValue, `Preserved if no header removed`);

    headers = new Request(request).headers;
    headers.append('foo', 'bar');
    assert_equals(header.get('Range'), rangeValue, `Preserved if silent-failure on append (due to request-no-cors guard)`);

    headers = new Request(request).headers;
    headers.set('foo', 'bar');
    assert_equals(header.get('Range'), rangeValue, `Preserved if silent-failure on set (due to request-no-cors guard)`);

    headers = new Request(request).headers;
    headers.append('Range', 'foo');
    assert_equals(header.get('Range'), rangeValue, `Preserved if silent-failure on append (due to request-no-cors guard)`);

    headers = new Request(request).headers;
    headers.set('Range', 'foo');
    assert_equals(header.get('Range'), rangeValue, `Preserved if silent-failure on set (due to request-no-cors guard)`);

    headers = new Request(request).headers;
    headers.append('Accept', 'whatever');
    assert_equals(header.get('Range'), null, `Stripped if header successfully appended`);

    headers = new Request(request).headers;
    headers.set('Accept', 'whatever');
    assert_equals(header.get('Range'), null, `Stripped if header successfully set`);

    headers = new Request(request).headers;
    headers.delete('Accept');
    assert_equals(header.get('Range'), null, `Stripped if header successfully deleted`);

    headers = new Request(request).headers;
    headers.delete('Range');
    assert_equals(header.get('Range'), null, `Stripped if range header successfully deleted`);
  }, "Headers correctly filtered");

  done();
});
