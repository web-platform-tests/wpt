// META: title=Event.defaultPrevented

// There is another version of this test depending on document.createEvent(), in
// Event-defaultPrevented-createEvent.window.js.

var ev;

test(function() {
  ev = new Event("foo", { bubbles: true, cancelable: false });
  assert_equals(ev.defaultPrevented, false, "defaultPrevented");
}, "When an event is created, defaultPrevented should be initialized to false.");

test(function() {
  assert_equals(ev.cancelable, false, "cancelable (before)");
  ev.preventDefault();
  assert_equals(ev.cancelable, false, "cancelable (after)");
  assert_equals(ev.defaultPrevented, false, "defaultPrevented");
}, "preventDefault() should not change defaultPrevented if cancelable is false.");

test(function() {
  assert_equals(ev.cancelable, false, "cancelable (before)");
  ev.returnValue = false;
  assert_equals(ev.cancelable, false, "cancelable (after)");
  assert_equals(ev.defaultPrevented, false, "defaultPrevented");
}, "returnValue should not change defaultPrevented if cancelable is false.");

test(function() {
  ev = new Event("foo", { bubbles: true, cancelable: true });
  assert_equals(ev.cancelable, true, "cancelable (before)");
  ev.preventDefault();
  assert_equals(ev.cancelable, true, "cancelable (after)");
  assert_equals(ev.defaultPrevented, true, "defaultPrevented");
}, "preventDefault() should change defaultPrevented if cancelable is true.");

test(function() {
  assert_equals(ev.cancelable, true, "cancelable (before)");
  ev.returnValue = false;
  assert_equals(ev.cancelable, true, "cancelable (after)");
  assert_equals(ev.defaultPrevented, true, "defaultPrevented");
}, "returnValue should change defaultPrevented if cancelable is true.");

test(function() {
  ev.initEvent("foo", true, true);
  assert_equals(ev.bubbles, true, "bubbles");
  assert_equals(ev.cancelable, true, "cancelable");
  assert_equals(ev.defaultPrevented, false, "defaultPrevented");
}, "initEvent should unset defaultPrevented.");
