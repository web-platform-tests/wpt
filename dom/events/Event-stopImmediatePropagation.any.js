// META: title=Event's stopImmediatePropagation

// https://dom.spec.whatwg.org/#dom-event-stopimmediatepropagation
// Author: Domenic Denicola <d@domenic.me>

// There is another version of this test using a DOM node as the event target,
// in Event-stopImmediatePropagation-dom.html.

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
