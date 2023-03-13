// META: script=/common/utils.js
// META: script=resources/support.sub.js
//
// Spec: https://wicg.github.io/local-network-access/#cors-preflight
//
// These tests verify that LNA preflight responses are cached.
//
// TODO(https://crbug.com/1268312): We cannot currently test that cache
// entries are keyed by target IP address space because that requires
// loading the same URL from different IP address spaces, and the WPT
// framework does not allow that.
promise_test(async t => {
  let uuid = token();
  await fetchTest(t, {
    source: { server: Server.HTTPS_LOCAL },
    target: {
      server: Server.HTTPS_LOOPBACK,
      behavior: {
        preflight: PreflightBehavior.singlePreflight(uuid),
        response: ResponseBehavior.allowCrossOrigin(),
      },
    },
    expected: FetchTestResult.SUCCESS,
  });
  await fetchTest(t, {
    source: { server: Server.HTTPS_LOCAL },
    target: {
      server: Server.HTTPS_LOOPBACK,
      behavior: {
        preflight: PreflightBehavior.singlePreflight(uuid),
        response: ResponseBehavior.allowCrossOrigin(),
      },
    },
    expected: FetchTestResult.SUCCESS,
  });
}, "local to loopback: success.");

promise_test(async t => {
  let uuid = token();
  await fetchTest(t, {
    source: { server: Server.HTTPS_PUBLIC },
    target: {
      server: Server.HTTPS_LOOPBACK,
      behavior: {
        preflight: PreflightBehavior.singlePreflight(uuid),
        response: ResponseBehavior.allowCrossOrigin(),
      },
    },
    expected: FetchTestResult.SUCCESS,
  });
  await fetchTest(t, {
    source: { server: Server.HTTPS_PUBLIC },
    target: {
      server: Server.HTTPS_LOOPBACK,
      behavior: {
        preflight: PreflightBehavior.singlePreflight(uuid),
        response: ResponseBehavior.allowCrossOrigin(),
      },
    },
    expected: FetchTestResult.SUCCESS,
  });
}, "public to loopback: success.");

promise_test(async t => {
  let uuid = token();
  await fetchTest(t, {
    source: { server: Server.HTTPS_PUBLIC },
    target: {
      server: Server.HTTPS_LOCAL,
      behavior: {
        preflight: PreflightBehavior.singlePreflight(uuid),
        response: ResponseBehavior.allowCrossOrigin(),
      },
    },
    expected: FetchTestResult.SUCCESS,
  });
  await fetchTest(t, {
    source: { server: Server.HTTPS_PUBLIC },
    target: {
      server: Server.HTTPS_LOCAL,
      behavior: {
        preflight: PreflightBehavior.singlePreflight(uuid),
        response: ResponseBehavior.allowCrossOrigin(),
      },
    },
    expected: FetchTestResult.SUCCESS,
  });
}, "public to local: success.");
