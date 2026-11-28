// META: global=shadowrealm

// The non-ShadowRealm version of this test is in Event-type-empty.html.

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
