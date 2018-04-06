function headersGuardNone(fill) {
  if (fill) return new Headers(fill);
  return new Headers();
}

function headersGuardResponse(fill) {
  if (fill) return new Response('', { headers: fill }).headers;
  return new Response('').headers;
}

function headersGuardRequest(fill) {
  if (fill) return new Request('./', { headers: fill }).headers;
  return new Request('./').headers;
}

function headersGuardRequestNoCors(fill) {
  if (fill) return new Request('./', { headers: fill, mode: 'no-cors' }).headers;
  return new Request('./', { mode: 'no-cors' }).headers;
}

test(() => {
  // Setting range should work for these guards
  for (const createHeaders of [headersGuardNone, headersGuardResponse, headersGuardRequest]) {
    let headers = createHeaders({ Range: 'foo' });
    assert_equals(headers.get('Range'), 'foo');

    headers = createHeaders();
    headers.append('Range', 'foo');
    assert_equals(headers.get('Range'), 'foo');

    headers = createHeaders();
    headers.set('Range', 'foo');
    assert_equals(headers.get('Range'), 'foo');
  }

  // It shouldn't work for the request-no-cors guard
  let headers = headersGuardRequestNoCors({ Range: 'foo' });
  assert_false(headers.has('Range'));

  headers = headersGuardRequestNoCors();
  headers.append('Range', 'foo');
  assert_false(headers.has('Range'));

  headers = headersGuardRequestNoCors();
  headers.set('Range', 'foo');
  assert_false(headers.has('Range'));
}, `Privileged header is allowed unless guard is request-no-cors`);
