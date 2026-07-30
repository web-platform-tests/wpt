// META: title=Test ShadowRealm isSecureContext in ServiceWorker
// META: global=shadowrealm-in-serviceworker

test(() => {
  assert_true(isSecureContext, "isSecureContext should be true");
}, "ShadowRealm isSecureContext is true when created from a ServiceWorker");
