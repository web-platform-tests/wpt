// META: script=/common/utils.js
// META: script=resources/support.sub.js
//
// Spec: https://wicg.github.io/local-network-access/#integration-fetch
//
// These tests mirror `Worker` tests, except using `SharedWorker`.
// See also: shared-worker.window.js
//
// This file covers only those tests that must execute in a non secure context.
// Other tests are defined in: shared-worker.https.window.js

promise_test(t => sharedWorkerScriptTest(t, {
  source: {
    server: Server.HTTP_LOOPBACK,
    treatAsPublic: true,
  },
  target: { server: Server.HTTP_LOOPBACK },
  expected: WorkerScriptTestResult.FAILURE,
}), "treat-as-public to loopback: failure.");

promise_test(t => sharedWorkerScriptTest(t, {
  source: {
    server: Server.HTTP_LOCAL,
    treatAsPublic: true,
  },
  target: { server: Server.HTTP_LOCAL },
  expected: WorkerScriptTestResult.FAILURE,
}), "treat-as-public to local: failure.");

promise_test(t => sharedWorkerScriptTest(t, {
  source: { server: Server.HTTP_PUBLIC },
  target: { server: Server.HTTP_PUBLIC },
  expected: WorkerScriptTestResult.SUCCESS,
}), "public to public: success.");
