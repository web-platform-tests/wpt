// META: script=/common/utils.js
// META: script=resources/support.sub.js
//
// Spec: https://wicg.github.io/local-network-access/#integration-fetch
//
// These tests verify that non-secure contexts cannot fetch subresources from
// less-public address spaces, and can fetch them otherwise.
//
// This file covers only those tests that must execute in a non secure context.
// Other tests are defined in: fetch.https.window.js

setup(() => {
  // Making sure we are in a non secure context, as expected.
  assert_false(window.isSecureContext);
});

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_LOOPBACK },
  target: { server: Server.HTTP_LOOPBACK },
  expected: FetchTestResult.SUCCESS,
}), "loopback to loopback: no preflight required.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_LOOPBACK },
  target: {
    server: Server.HTTP_LOCAL,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: FetchTestResult.SUCCESS,
}), "loopback to local: no preflight required.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_LOOPBACK },
  target: {
    server: Server.HTTP_PUBLIC,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: FetchTestResult.SUCCESS,
}), "loopback to public: no preflight required.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_LOCAL },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: FetchTestResult.FAILURE,
}), "local to loopback: failure.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_LOCAL },
  target: { server: Server.HTTP_LOCAL },
  expected: FetchTestResult.SUCCESS,
}), "local to local: no preflight required.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_LOCAL },
  target: {
    server: Server.HTTP_PUBLIC,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: FetchTestResult.SUCCESS,
}), "local to public: no preflight required.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_PUBLIC },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: FetchTestResult.FAILURE,
}), "public to loopback: failure.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_PUBLIC },
  target: {
    server: Server.HTTP_LOCAL,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: FetchTestResult.FAILURE,
}), "public to local: failure.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTP_PUBLIC },
  target: { server: Server.HTTP_PUBLIC },
  expected: FetchTestResult.SUCCESS,
}), "public to public: no preflight required.");

// These tests verify that documents fetched from the `loopback` address space yet
// carrying the `treat-as-public-address` CSP directive are treated as if they
// had been fetched from the `public` address space.

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTP_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public-address to loopback: failure.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTP_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTP_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public-address to local: failure.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTP_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTP_PUBLIC,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: FetchTestResult.SUCCESS,
}), "treat-as-public-address to public: no preflight required.");

// These tests verify that HTTPS iframes embedded in an HTTP top-level document
// cannot fetch subresources from less-public address spaces. Indeed, even
// though the iframes have HTTPS origins, they are non-secure contexts because
// their parent is a non-secure context.

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: FetchTestResult.FAILURE,
}), "local https to loopback: failure.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: FetchTestResult.FAILURE,
}), "public https to loopback: failure.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: FetchTestResult.FAILURE,
}), "public https to local: failure.");
