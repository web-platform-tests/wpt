// META: global=shadowrealm

// The non-ShadowRealm version of this test is in CustomEvent.html.

test(function() {
  var type = "foo";

  var target = new EventTarget();
  target.addEventListener(type, this.step_func(function(evt) {
    assert_equals(evt.type, type);
  }), true);

  var fooEvent = new CustomEvent("foo", { bubbles: true, cancelable: true });
  target.dispatchEvent(fooEvent);
}, "CustomEvent dispatching.");

test(function () {
  assert_throws_js(TypeError, function() {
    new CustomEvent();
  });
}, "First parameter to CustomEvent constructor should be mandatory.");

test(function() {
    var e = new CustomEvent("foo");
    assert_throws_js(TypeError, function() {
        e.initCustomEvent();
    });
}, "First parameter to initCustomEvent should be mandatory.");

test(function() {
  var e = new CustomEvent("foo");
  assert_equals(e.type, "foo", "type");
  assert_false(e.bubbles, "bubbles");
  assert_false(e.cancelable, "cancelable");
  assert_equals(e.detail, null, "detail");
}, "CustomEvent's default option values.");
