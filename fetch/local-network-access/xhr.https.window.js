// META: script=/common/subset-tests-by-key.js
// META: script=/common/utils.js
// META: script=resources/support.sub.js
// META: variant=?include=from-loopback
// META: variant=?include=from-local
// META: variant=?include=from-public
//
// Spec: https://wicg.github.io/local-network-access/#integration-fetch
//
// These tests mirror fetch.https.window.js, but use `XmlHttpRequest` instead of
// `fetch()` to perform subresource fetches. Preflights are tested less
// extensively due to coverage being already provided by `fetch()`.
//
// This file covers only those tests that must execute in a secure context.
// Other tests are defined in: xhr.window.js

setup(() => {
  // Making sure we are in a secure context, as expected.
  assert_true(window.isSecureContext);
});

// Source: secure loopback context.
//
// All fetches unaffected by Local Network Access.

subsetTestByKey("from-loopback", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: { server: Server.HTTPS_LOOPBACK },
  expected: XhrTestResult.SUCCESS,
}), "loopback to loopback: no preflight required.");

subsetTestByKey("from-loopback", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.SUCCESS,
}), "loopback to local: no preflight required.");

subsetTestByKey("from-loopback", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: {
    server: Server.HTTPS_PUBLIC,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.SUCCESS,
}), "loopback to public: no preflight required.");

// Source: local secure context.
//
// Fetches to the loopback address space require a successful preflight response
// carrying a LNA-specific header.

subsetTestByKey("from-local", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.FAILURE,
}), "local to loopback: failed preflight.");

subsetTestByKey("from-local", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: XhrTestResult.SUCCESS,
}), "local to loopback: success.");

subsetTestByKey("from-local", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: { server: Server.HTTPS_LOCAL },
  expected: XhrTestResult.SUCCESS,
}), "local to private: no preflight required.");

subsetTestByKey("from-local", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_PUBLIC,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.SUCCESS,
}), "local to public: no preflight required.");

// Source: public secure context.
//
// Fetches to the loopback and local address spaces require a successful
// preflight response carrying a LNA-specific header.

subsetTestByKey("from-public", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.FAILURE,
}), "public to loopback: failed preflight.");

subsetTestByKey("from-public", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: XhrTestResult.SUCCESS,
}), "public to loopback: success.");

subsetTestByKey("from-public", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: XhrTestResult.FAILURE,
}), "public to local: failed preflight.");

subsetTestByKey("from-public", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: XhrTestResult.SUCCESS,
}), "public to local: success.");

subsetTestByKey("from-public", promise_test, t => xhrTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: { server: Server.HTTPS_PUBLIC },
  expected: XhrTestResult.SUCCESS,
}), "public to public: no preflight required.");
