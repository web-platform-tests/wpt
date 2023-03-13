// META: script=/common/utils.js
// META: script=resources/support.sub.js
//
// Spec: https://wicg.github.io/local-network-access/#integration-fetch
//
// This test verifies that Local Network Access checks are applied to all
// the endpoints in a redirect chain, relative to the same client context.

// loopback -> local -> public
//
// Request 1 (loopback -> local): no preflight.
// Request 2 (loopback -> public): no preflight.

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_PUBLIC,
        behavior: { response: ResponseBehavior.allowCrossOrigin() },
      }),
    }
  },
  expected: FetchTestResult.SUCCESS,
}), "loopback to local to public: success.");

// loopback -> local -> loopback
//
// Request 1 (loopback -> local): no preflight.
// Request 2 (loopback -> loopback): no preflight.
//
// This checks that the client for the second request is still the initial
// context, not the redirector.

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: { response: ResponseBehavior.allowCrossOrigin() },
      }),
    }
  },
  expected: FetchTestResult.SUCCESS,
}), "loopback to local to loopback: success.");

// local -> private -> loopback
//
// Request 1 (local -> private): no preflight.
// Request 2 (local -> loopback): preflight required.
//
// This verifies that LNA checks are applied after redirects.

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: { response: ResponseBehavior.allowCrossOrigin() },
      }),
    }
  },
  expected: FetchTestResult.FAILURE,
}), "local to private to loopback: failed preflight.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: {
          preflight: PreflightBehavior.success(token()),
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.SUCCESS,
}), "local to private to loopback: success.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: { preflight: PreflightBehavior.success(token()) },
      }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.OPAQUE,
}), "local to private to loopback: no-cors success.");

// local -> loopback -> private
//
// Request 1 (local -> loopback): preflight required.
// Request 2 (local -> private): no preflight.
//
// This verifies that LNA checks are applied independently to every step in a
// redirect chain.

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOCAL,
      }),
    }
  },
  expected: FetchTestResult.FAILURE,
}), "local to loopback to private: failed preflight.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOCAL,
        behavior: { response: ResponseBehavior.allowCrossOrigin() },
      }),
    }
  },
  expected: FetchTestResult.SUCCESS,
}), "local to loopback to private: success.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      redirect: preflightUrl({ server: Server.HTTPS_LOCAL }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.OPAQUE,
}), "local to loopback to private: no-cors success.");

// public -> local -> loopback
//
// Request 1 (public -> local): preflight required.
// Request 2 (public -> loopback): preflight required.
//
// This verifies that LNA checks are applied to every step in a redirect chain.

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: {
          preflight: PreflightBehavior.success(token()),
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.FAILURE,
}), "public to local to loopback: failed first preflight.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: {
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.FAILURE,
}), "public to local to loopback: failed second preflight.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: {
          preflight: PreflightBehavior.success(token()),
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.SUCCESS,
}), "public to local to loopback: success.");

promise_test(t => fetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: { preflight: PreflightBehavior.success(token()) },
      }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.OPAQUE,
}), "public to local to loopback: no-cors success.");

// treat-as-public -> loopback -> local

// Request 1 (treat-as-public -> loopback): preflight required.
// Request 2 (treat-as-public -> local): preflight required.

// This verifies that LNA checks are applied to every step in a redirect chain.

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      redirect: preflightUrl({
        server: Server.HTTPS_LOCAL,
        behavior: {
          preflight: PreflightBehavior.success(token()),
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public to loopback to local: failed first preflight.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      redirect: preflightUrl({
        server: Server.HTTPS_LOCAL,
        behavior: {
          preflight: PreflightBehavior.noPnaHeader(token()),
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public to loopback to local: failed second preflight.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      redirect: preflightUrl({
        server: Server.HTTPS_LOCAL,
        behavior: {
          preflight: PreflightBehavior.success(token()),
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.SUCCESS,
}), "treat-as-public to loopback to local: success.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      redirect: preflightUrl({
        server: Server.HTTPS_LOCAL,
        behavior: { preflight: PreflightBehavior.success(token()) },
      }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public to loopback to local: no-cors failed first preflight.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      redirect: preflightUrl({ server: Server.HTTPS_LOCAL }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public to loopback to local: no-cors failed second preflight.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      redirect: preflightUrl({
        server: Server.HTTPS_LOCAL,
        behavior: { preflight: PreflightBehavior.success(token()) },
      }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.OPAQUE,
}), "treat-as-public to loopback to local: no-cors success.");

// treat-as-public -> local -> loopback

// Request 1 (treat-as-public -> local): preflight required.
// Request 2 (treat-as-public -> loopback): preflight required.

// This verifies that LNA checks are applied to every step in a redirect chain.

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  server: Server.HTTPS_LOCAL,
  target: {
    behavior: {
      preflight: PreflightBehavior.noPnaHeader(token()),
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: {
          preflight: PreflightBehavior.success(token()),
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public to local to loopback: failed first preflight.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: { response: ResponseBehavior.allowCrossOrigin() },
      }),
    }
  },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public to local to loopback: failed second preflight.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: {
          preflight: PreflightBehavior.success(token()),
          response: ResponseBehavior.allowCrossOrigin(),
        },
      }),
    }
  },
  expected: FetchTestResult.SUCCESS,
}), "treat-as-public to local to loopback: success.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: { preflight: PreflightBehavior.success(token()) },
      }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public to local to loopback: no-cors failed first preflight.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      redirect: preflightUrl({ server: Server.HTTPS_LOOPBACK }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.FAILURE,
}), "treat-as-public to local to loopback: no-cors failed second preflight.");

promise_test(t => fetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      redirect: preflightUrl({
        server: Server.HTTPS_LOOPBACK,
        behavior: { preflight: PreflightBehavior.success(token()) },
      }),
    }
  },
  fetchOptions: { mode: "no-cors" },
  expected: FetchTestResult.OPAQUE,
}), "treat-as-public to local to loopback: no-cors success.");
