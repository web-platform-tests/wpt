// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/utils.js
// META: script=resources/support.sub.js
//
// Spec: https://wicg.github.io/local-network-access/#integration-fetch
//
// These tests verify that contexts can navigate iframes to less-public address
// spaces iff the target server responds affirmatively to preflight requests.
//
// This file covers only those tests that must execute in a secure context.
// Other tests are defined in: iframe.tentative.window.js

setup(() => {
  assert_true(window.isSecureContext);
});

// Source: secure loopback context.
//
// All fetches unaffected by Local Network Access.

promise_test_parallel(t => iframeTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: { server: Server.HTTPS_LOOPBACK },
  expected: IframeTestResult.SUCCESS,
}), "loopback to loopback: no preflight required.");

promise_test_parallel(t => iframeTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: { server: Server.HTTPS_LOCAL },
  expected: IframeTestResult.SUCCESS,
}), "loopback to local: no preflight required.");

promise_test_parallel(t => iframeTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: { server: Server.HTTPS_PUBLIC },
  expected: IframeTestResult.SUCCESS,
}), "loopback to public: no preflight required.");

// Generates tests of preflight behavior for a single (source, target) pair.
//
// Scenarios:
//
// - parent navigates child:
//   - preflight response has non-2xx HTTP code
//   - preflight response is missing CORS headers
//   - preflight response is missing the LNA-specific `Access-Control` header
//   - success
//
function makePreflightTests({
  sourceName,
  sourceServer,
  sourceTreatAsPublic,
  targetName,
  targetServer,
}) {
  const prefix =
      `${sourceName} to ${targetName}: `;

  const source = {
    server: sourceServer,
    treatAsPublic: sourceTreatAsPublic,
  };

  promise_test_parallel(t => iframeTest(t, {
    source,
    target: {
      server: targetServer,
      behavior: { preflight: PreflightBehavior.failure() },
    },
    expected: IframeTestResult.FAILURE,
  }), prefix + "failed preflight.");

  promise_test_parallel(t => iframeTest(t, {
    source,
    target: {
      server: targetServer,
      behavior: { preflight: PreflightBehavior.noCorsHeader(token()) },
    },
    expected: IframeTestResult.FAILURE,
  }), prefix + "missing CORS headers.");

  promise_test_parallel(t => iframeTest(t, {
    source,
    target: {
      server: targetServer,
      behavior: { preflight: PreflightBehavior.noPnaHeader(token()) },
    },
    expected: IframeTestResult.FAILURE,
  }), prefix + "missing LNA header.");

  promise_test_parallel(t => iframeTest(t, {
    source,
    target: {
      server: targetServer,
      behavior: { preflight: PreflightBehavior.success(token()) },
    },
    expected: IframeTestResult.SUCCESS,
  }), prefix + "success.");
}

// Source: local secure context.
//
// Fetches to the loopback address space require a successful preflight response
// carrying a LNA-specific header.

makePreflightTests({
  sourceServer: Server.HTTPS_LOCAL,
  sourceName: "local",
  targetServer: Server.HTTPS_LOOPBACK,
  targetName: "loopback",
});

promise_test_parallel(t => iframeTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: { server: Server.HTTPS_LOCAL },
  expected: IframeTestResult.SUCCESS,
}), "local to local: no preflight required.");

promise_test_parallel(t => iframeTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: { server: Server.HTTPS_PUBLIC },
  expected: IframeTestResult.SUCCESS,
}), "local to public: no preflight required.");

// Source: public secure context.
//
// Fetches to the loopback and local address spaces require a successful
// preflight response carrying a LNA-specific header.

makePreflightTests({
  sourceServer: Server.HTTPS_PUBLIC,
  sourceName: "public",
  targetServer: Server.HTTPS_LOOPBACK,
  targetName: "loopback",
});

makePreflightTests({
  sourceServer: Server.HTTPS_PUBLIC,
  sourceName: "public",
  targetServer: Server.HTTPS_LOCAL,
  targetName: "local",
});

promise_test_parallel(t => iframeTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: { server: Server.HTTPS_PUBLIC },
  expected: IframeTestResult.SUCCESS,
}), "public to public: no preflight required.");

// The following tests verify that `CSP: treat-as-public-address` makes
// documents behave as if they had been served from a public IP address.

makePreflightTests({
  sourceServer: Server.HTTPS_LOOPBACK,
  sourceTreatAsPublic: true,
  sourceName: "treat-as-public-address",
  targetServer: Server.HTTPS_LOOPBACK,
  targetName: "loopback",
});

makePreflightTests({
  sourceServer: Server.HTTPS_LOOPBACK,
  sourceTreatAsPublic: true,
  sourceName: "treat-as-public-address",
  targetServer: Server.HTTPS_LOCAL,
  targetName: "local",
});

promise_test_parallel(t => iframeTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: { server: Server.HTTPS_PUBLIC },
  expected: IframeTestResult.SUCCESS,
}), "treat-as-public-address to public: no preflight required.");

promise_test_parallel(t => iframeTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_PUBLIC,
    behavior: { preflight: PreflightBehavior.optionalSuccess(token()) }
  },
  expected: IframeTestResult.SUCCESS,
}), "treat-as-public-address to loopback: optional preflight");

// The following tests verify that when a grandparent frame navigates its
// grandchild, the IP address space of the grandparent is compared against the
// IP address space of the response. Indeed, the navigation initiator in this
// case is the grandparent, not the parent.

iframeGrandparentTest({
  name: "loopback to loopback, grandparent navigates: no preflight required.",
  grandparentServer: Server.HTTPS_LOOPBACK,
  child: { server: Server.HTTPS_PUBLIC },
  grandchild: { server: Server.HTTPS_LOOPBACK },
  expected: IframeTestResult.SUCCESS,
});

iframeGrandparentTest({
  name: "public to loopback, grandparent navigates: failure.",
  grandparentServer: Server.HTTPS_PUBLIC,
  child: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { preflight: PreflightBehavior.success(token()) },
  },
  grandchild: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { preflight: PreflightBehavior.failure() },
  },
  expected: IframeTestResult.FAILURE,
});

iframeGrandparentTest({
  name: "public to loopback, grandparent navigates: success.",
  grandparentServer: Server.HTTPS_PUBLIC,
  child: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { preflight: PreflightBehavior.success(token()) },
  },
  grandchild: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { preflight: PreflightBehavior.success(token()) },
  },
  expected: IframeTestResult.SUCCESS,
});
