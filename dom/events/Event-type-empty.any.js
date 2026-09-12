// META: title=Event.type set to the empty string

// Author: Ms2ger <Ms2ger@gmail.com>
// https://dom.spec.whatwg.org/#dom-event-type

// There is another version of this test, testing an event created with
// document.createEvent() and dispatching the event on a DOM node, in
// Event-type-empty-createEvent.window.js.

async_test(function() {
  var e = new Event("");
  assert_equals(e.type, "", "type");
  assert_equals(e.bubbles, false, "bubbles");
  assert_equals(e.cancelable, false, "cancelable");

  var target = new EventTarget();
  var handled = false;
  target.addEventListener("", this.step_func(function(e) {
    handled = true;
  }));
  assert_true(target.dispatchEvent(e), "dispatchEvent should return true");
  assert_true(handled, "callback should be called");
  this.done();
}, "Constructor");
