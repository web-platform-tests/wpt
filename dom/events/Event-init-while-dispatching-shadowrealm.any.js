// META: global=shadowrealm

// The non-ShadowRealm version of this test is in
// Event-init-while-dispatching.html.

var events = {
  'CustomEvent': {
    'constructor': function() { return new CustomEvent("type") },
    'init': function(ev) { ev.initCustomEvent("type2", true, true, 1) },
    'check': function(ev) {
      assert_equals(ev.detail, null, "initCustomEvent detail setter should short-circuit");
    }
  },
  'Event': {
    'constructor': function() { return new Event("type") },
    'init': function(ev) { ev.initEvent("type2", true, true) },
    'check': function(ev) {
      assert_equals(ev.bubbles, false, "initEvent bubbles setter should short-circuit");
      assert_equals(ev.cancelable, false, "initEvent cancelable setter should short-circuit");
      assert_equals(ev.type, "type", "initEvent type setter should short-circuit");
    }
  }
};

var names = Object.keys(events);
for (var i = 0; i < names.length; i++) {
  var t = async_test("Calling init" + names[i] + " while dispatching.");
  t.step(function() {
    var e = events[names[i]].constructor();
    var called = false;

    var target = new EventTarget();
    target.addEventListener("type", t.step_func(function() {
      called = true;
      events[names[i]].init(e);

      var o = e;
      while ((o = Object.getPrototypeOf(o))) {
        if (!(o.constructor.name in events)) {
          break;
        }
        events[o.constructor.name].check(e);
      }
    }), false);

    assert_equals(target.dispatchEvent(e), true, "dispatchEvent must return true");
    assert_true(called, "callback should be called");
  });
  t.done();
}
