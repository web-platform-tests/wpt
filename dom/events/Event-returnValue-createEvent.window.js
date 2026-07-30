// META: title=Event.returnValue set in between document.createEvent and initEvent

// Author: Chris Rebert <http://chrisrebert.com>
// https://dom.spec.whatwg.org/#dom-event-returnvalue

test(function() {
  var ev = document.createEvent("Event");
  ev.returnValue = false;
  ev.initEvent("foo", true, true);
  assert_true(ev.bubbles, "bubbles");
  assert_true(ev.cancelable, "cancelable");
  assert_true(ev.returnValue, "returnValue");
}, "initEvent should unset returnValue.");
