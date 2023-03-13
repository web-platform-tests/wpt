// META: script=/common/utils.js
// META: script=resources/support.sub.js
//
// Spec: https://wicg.github.io/local-network-access/#integration-fetch
//
// These tests check that fetches from within `SharedWorker` scripts that are
// loaded from blob URLs are subject to Local Network Access checks, just like
// fetches from within documents.
//
// This file covers only those tests that must execute in a non-secure context.
// Other tests are defined in: shared-worker-blob-fetch.https.window.js

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTP_LOOPBACK },
  target: { server: Server.HTTP_LOOPBACK },
  expected: WorkerFetchTestResult.SUCCESS,
}), "loopback to loopback: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTP_LOCAL },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "local to loopback: failure.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTP_LOCAL },
  target: { server: Server.HTTP_LOCAL },
  expected: WorkerFetchTestResult.SUCCESS,
}), "local to private: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTP_PUBLIC },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "public to loopback: failure.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTP_PUBLIC },
  target: {
    server: Server.HTTP_LOCAL,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "public to local: failure.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTP_PUBLIC },
  target: { server: Server.HTTP_PUBLIC },
  expected: WorkerFetchTestResult.SUCCESS,
}), "public to public: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: {
    server: Server.HTTP_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: { preflight: PreflightBehavior.optionalSuccess(token()) },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "treat-as-public to loopback: failure.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: {
    server: Server.HTTP_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTP_LOCAL,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "treat-as-public to local: failure.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: {
    server: Server.HTTP_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTP_PUBLIC,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "treat-as-public to public: success.");

// The following tests verify that workers served over HTTPS are not allowed to
// make local network requests because they are not secure contexts.

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "loopback https to loopback: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "local https to loopback: failure.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTP_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "public https to loopback: failure.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_LOOPBACK },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "loopback https to loopback https: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "local https to loopback https: failure.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.optionalSuccess(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "public https to loopback https: failure.");
