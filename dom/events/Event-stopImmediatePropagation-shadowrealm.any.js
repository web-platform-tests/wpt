// META: global=shadowrealm

// The non-ShadowRealm version of this test is in
// Event-stopImmediatePropagation.html.

"use strict";

setup({ single_test: true });

const target = new EventTarget();

let timesCalled = 0;
target.addEventListener("test", e => {
  ++timesCalled;
  e.stopImmediatePropagation();
  assert_equals(e.cancelBubble, true, "The stop propagation flag must have been set");
});
target.addEventListener("test", () => {
  ++timesCalled;
});

const e = new Event("test");
target.dispatchEvent(e);
assert_equals(timesCalled, 1, "The second listener must not have been called");

done();
