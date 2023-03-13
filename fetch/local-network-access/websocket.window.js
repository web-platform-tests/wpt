// META: script=resources/support.sub.js
//
// Spec: https://wicg.github.io/local-network-access/#integration-fetch

// These tests verify that websocket connections behave similarly to fetches.
//
// This file covers only those tests that must execute in a non secure context.
// Other tests are defined in: websocket.https.window.js

setup(() => {
  // Making sure we are in a non secure context, as expected.
  assert_false(window.isSecureContext);
});

promise_test(t => websocketTest(t, {
  source: { server: Server.HTTP_LOOPBACK },
  target: { server: Server.WS_LOOPBACK },
  expected: WebsocketTestResult.SUCCESS,
}), "loopback to loopback: websocket success.");

promise_test(t => websocketTest(t, {
  source: { server: Server.HTTP_LOCAL },
  target: { server: Server.WS_LOOPBACK },
  expected: WebsocketTestResult.FAILURE,
}), "local to loopback: websocket failure.");

promise_test(t => websocketTest(t, {
  source: { server: Server.HTTP_PUBLIC },
  target: { server: Server.WS_LOOPBACK },
  expected: WebsocketTestResult.FAILURE,
}), "public to loopback: websocket failure.");

promise_test(t => websocketTest(t, {
  source: {
    server: Server.HTTP_LOOPBACK,
    treatAsPublic: true,
  },
  target: { server: Server.WS_LOOPBACK },
  expected: WebsocketTestResult.FAILURE,
}), "treat-as-public to loopback: websocket failure.");
