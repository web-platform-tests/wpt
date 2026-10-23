// META: title=Test ShadowRealm isSecureContext in AudioWorklet
// META: global=shadowrealm-in-audioworklet

test(() => {
  assert_false(isSecureContext, "isSecureContext should be false");
}, "ShadowRealm isSecureContext is false when created from an AudioWorklet");
