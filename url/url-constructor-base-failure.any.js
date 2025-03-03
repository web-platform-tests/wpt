// META: global=window,dedicatedworker,shadowrealm

promise_test(() => fetch_json("resources/urltestdata.json").then(runTests), "Loading data…")

function runTests(urlTests) {
  for (const expected of urlTests) {
    // skip comments, inputs we expect to pass and relative URLs
    if (typeof expected === "string" || !expected.failure || expected.base !== null) {
      continue;
    }

    const name = expected.input + " should throw"

    test(() => {
      // URL's constructor's first argument is tested by url-constructor.any.js
      // If a URL fails to parse with any valid base, it must also fail to parse
      // with no base, i.e. when used as a base URL itself.
      assert_throws_js(TypeError, () => new URL("about:blank", expected.input));
    }, "URL's constructor's base argument: " + name)

    test(() => {
      const url = new URL("about:blank")
      assert_throws_js(TypeError, () => url.href = expected.input)
    }, "URL's href: " + name)
  }
}
