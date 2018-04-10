// Helpers that return headers objects with a particular guard
function headersGuardNone(fill) {
  if (fill) return new Headers(fill);
  return new Headers();
}

function headersGuardResponse(fill) {
  const opts = {};
  if (fill) opts.headers = fill;
  return new Response('', opts).headers;
}

function headersGuardRequest(fill) {
  const opts = {};
  if (fill) opts.headers = fill;
  return new Request('./', opts).headers;
}

function headersGuardRequestNoCors(fill) {
  const opts = { mode: 'no-cors' };
  if (fill) opts.headers = fill;
  return new Request('./', opts).headers;
}

test(() => {
  // Setting range should work for these guards
  for (const createHeaders of [headersGuardNone, headersGuardResponse, headersGuardRequest]) {
    // There are three ways to set headers.
    // Filling, appending, and setting. Test each:
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

