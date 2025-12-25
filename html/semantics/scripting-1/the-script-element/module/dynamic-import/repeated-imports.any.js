// META: global=window,dedicatedworker,sharedworker
// META: script=/common/utils.js

promise_test(async test => {
    const uuid_token = token();
    // Set up the server to respond with JSON first
    await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=set&content-type=application/json`, { cache: 'no-cache' });
    await promise_rejects_js(test, TypeError,
        import(`../../serve-custom-response.py?key=${uuid_token}`),
      "Dynamic import of JS with a JSON type response should fail");
    let request_counter = await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=stat`, { cache: 'no-cache' })
    assert_equals(await request_counter.text(), "1");

    // Import using the same specifier/type pair again; this time server still responds with JSON
    await promise_rejects_js(test, TypeError,
        import(`../../serve-custom-response.py?key=${uuid_token}`),
        "Dynamic import of JS with a JSON type response should fail again");
    // the server should have been contacted again because the failed import attempt did not create a module map entry
    request_counter = await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=stat`, { cache: 'no-cache' })
    assert_equals(await request_counter.text(), "2");

    // Import using the same specifier/type pair again; this time we get JS
    await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=set&content-type=application/javascript`, { cache: 'no-cache' });
    // it should succeed since the failed import attempt did not create a module map entry
    const result_js = await import(`../../serve-custom-response.py?key=${uuid_token}`);
    assert_equals(result_js.default, "hello");
    request_counter = await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=stat`, { cache: 'no-cache' })
    assert_equals(await request_counter.text(), "3");

    // Import using the same specifier/type pair again; this time server should not be contacted
    // because the module map entry should already exist.
    const result_js_2 = await import(`../../serve-custom-response.py?key=${uuid_token}`);
    assert_equals(result_js_2.default, "hello");
    request_counter = await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=stat`, { cache: 'no-cache' })
    assert_equals(await request_counter.text(), "3");
}, "An import should succeed even if the same specifier/type attribute pair previously failed due to a MIME type mismatch");

promise_test(async test => {
    const uuid_token = token();
    // Set up the server to respond with 404 first
    await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=set&code=404`, { cache: 'no-cache' });
    await promise_rejects_js(test, TypeError,
        import(`../../serve-custom-response.py?key=${uuid_token}`),
        "Dynamic import should fail with a 404 response");
    let request_counter = await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=stat`, { cache: 'no-cache' })
    assert_equals(await request_counter.text(), "1");

    // Import using the same specifier again; this time server still responds with 404
    await promise_rejects_js(test, TypeError,
        import(`../../serve-custom-response.py?key=${uuid_token}`),
        "Dynamic import should fail again with a 404 response");
    request_counter = await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=stat`, { cache: 'no-cache' })
    // the server should have been contacted again because the failed import attempt did not create a module map entry
    assert_equals(await request_counter.text(), "2");

    // Import using the same specifier again; this time we configure the server to respond with 200
    await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=set&code=200`, { cache: 'no-cache' });
    // it should succeed since the failed import attempt did not create a module map entry
    const result_js = await import(`../../serve-custom-response.py?key=${uuid_token}`);
    assert_equals(result_js.default, "hello");
    request_counter = await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=stat`, { cache: 'no-cache' })
    assert_equals(await request_counter.text(), "3");

    // Import using the same specifier again; this time server should not be contacted
    // because the module map entry should already exist.
    const result_js_2 = await import(`../../serve-custom-response.py?key=${uuid_token}`);
    assert_equals(result_js_2.default, "hello");
    request_counter = await fetch(`../../serve-custom-response.py?key=${uuid_token}&action=stat`, { cache: 'no-cache' })
    assert_equals(await request_counter.text(), "3");
}, "An import should succeed even if the same specifier/type pair previously failed due to a network error (e.g. 404)");
