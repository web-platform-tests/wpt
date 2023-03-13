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
  source: { server: Server.HTTPS_LOOPBACK },
  target: { server: Server.HTTPS_LOOPBACK },
  expected: WorkerFetchTestResult.SUCCESS,
}), "loopback to loopback: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "local to loopback: failed preflight.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "local to loopback: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_LOCAL },
  target: { server: Server.HTTPS_LOCAL },
  expected: WorkerFetchTestResult.SUCCESS,
}), "local to local: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "public to loopback: failed preflight.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "public to loopback: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "public to local: failed preflight.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "public to local: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: { server: Server.HTTPS_PUBLIC },
  target: { server: Server.HTTPS_PUBLIC },
  expected: WorkerFetchTestResult.SUCCESS,
}), "public to public: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: { server: Server.HTTPS_LOOPBACK },
  expected: WorkerFetchTestResult.FAILURE,
}), "treat-as-public to loopback: failed preflight.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOOPBACK,
    behavior: { preflight: PreflightBehavior.success(token()) },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "treat-as-public to loopback: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: WorkerFetchTestResult.FAILURE,
}), "treat-as-public to local: failed preflight.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_LOCAL,
    behavior: {
      preflight: PreflightBehavior.success(token()),
      response: ResponseBehavior.allowCrossOrigin(),
    },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "treat-as-public to local: success.");

promise_test(t => sharedWorkerBlobFetchTest(t, {
  source: {
    server: Server.HTTPS_LOOPBACK,
    treatAsPublic: true,
  },
  target: {
    server: Server.HTTPS_PUBLIC,
    behavior: { response: ResponseBehavior.allowCrossOrigin() },
  },
  expected: WorkerFetchTestResult.SUCCESS,
}), "treat-as-public to public: success.");

