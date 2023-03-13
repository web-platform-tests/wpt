// META: script=/common/utils.js
// META: script=resources/support.sub.js
//
// Spec: https://wicg.github.io/private-network-access/#integration-fetch
//
// These tests verify that documents fetched from the `loopback` address space yet
// carrying the `treat-as-public-address` CSP directive are treated as if they
// had been fetched from the `public` address space.

promise_test(t => xhrTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.FAILURE,
}), "treat-as-public to loopback: failed preflight.");

promise_test(t => xhrTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: XhrTestResult.SUCCESS,
}), "treat-as-public to loopback: success.");

promise_test(t => xhrTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_PRIVATE,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.FAILURE,
}), "treat-as-public to private: failed preflight.");

promise_test(t => xhrTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_PRIVATE,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: XhrTestResult.SUCCESS,
}), "treat-as-public to private: success.");

promise_test(t => xhrTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_PUBLIC,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.SUCCESS,
}), "treat-as-public to public: no preflight required.");
