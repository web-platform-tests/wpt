function fetch_tests(fetch_method, fetch_should_succeed, fetch_should_fail) {
  const blob_contents = 'test blob contents';
  const blob = new Blob([blob_contents]);

  promise_test(t => {
    const url = URL.createObjectURL(blob);

    return fetch_should_succeed(t, url).then(text => {
      assert_equals(text, blob_contents);
    });
  }, 'Check whether Blob URLs can be used in ' + fetch_method);

  promise_test(t => {
    const url = URL.createObjectURL(blob);

    return fetch_should_succeed(t, url + '#fragment').then(text => {
      assert_equals(text, blob_contents);
    });
  }, fetch_method + ' with a fragment should succeed');

  promise_test(t => {
    const url = URL.createObjectURL(blob);
    URL.revokeObjectURL(url);

    return fetch_should_fail(t, url);
  }, fetch_method + ' of a revoked URL should fail');

  promise_test(t => {
    const url = URL.createObjectURL(blob);
    URL.revokeObjectURL(url + '#fragment');

    return fetch_should_succeed(t, url).then(text => {
      assert_equals(text, blob_contents);
    });
  }, 'Only exact matches should revoke URLs, using ' + fetch_method);

  promise_test(t => {
    const url = URL.createObjectURL(blob);

    return fetch_should_fail(t, url + '?querystring');
  }, 'Appending a query string should cause ' + fetch_method + ' to fail');

  promise_test(t => {
    const url = URL.createObjectURL(blob);

    return fetch_should_fail(t, url + '/path');
  }, 'Appending a path should cause ' + fetch_method + ' to fail');

  for (const method of ['HEAD', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'CUSTOM']) {
    const url = URL.createObjectURL(blob);

    promise_test(t => {
      return fetch_should_fail(t, url, method);
    }, fetch_method + ' with method "' + method + '" should fail');
  }
}