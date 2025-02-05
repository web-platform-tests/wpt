// META: global=shadowrealm

// The non-ShadowRealm version of this test is in Event-cancelBubble.html.

test(function () {
  // See https://dom.spec.whatwg.org/#stop-propagation-flag
  var e = new Event("Event");
  assert_false(e.cancelBubble, "cancelBubble must be false after event creation.");
}, "cancelBubble must be false when an event is initially created.");

test(function () {
  // See https://dom.spec.whatwg.org/#dom-event-stoppropagation
  var e = new Event("Event");
  e.stopPropagation();
  assert_true(e.cancelBubble, "stopPropagation() must set cancelBubble to true.");
}, "stopPropagation() must set cancelBubble to true.");

test(function () {
  // See https://dom.spec.whatwg.org/#dom-event-stopimmediatepropagation
  var e = new Event("Event");
  e.stopImmediatePropagation();
  assert_true(e.cancelBubble, "stopImmediatePropagation() must set cancelBubble to true.");
}, "stopImmediatePropagation() must set cancelBubble to true.");

test(function () {
  var one = new Event("Event");
  one.stopPropagation();
  one.cancelBubble = false;
  assert_true(one.cancelBubble, "cancelBubble must still be true after attempting to set it to false.");
}, "Event.cancelBubble=false must have no effect.");

test(function () {
  // See https://dom.spec.whatwg.org/#concept-event-dispatch
  // "14. Unset event’s [...] stop propagation flag,"
  var e = new Event("foobar", { bubbles: true, cancelable: true });
  addEventListener("foobar", function listener(e) {
    e.stopPropagation();
  });
  dispatchEvent(e);
  assert_false(e.cancelBubble, "cancelBubble must be false after an event has been dispatched.");
}, "cancelBubble must be false after an event has been dispatched.");
