// META: global=shadowrealm

// The non-ShadowRealm version of this test is in
// EventTarget-dispatchEvent.html.

setup({
  "allow_uncaught_exception": true,
});

test(function() {
  assert_throws_js(TypeError, function() { dispatchEvent(null); });
}, "Calling dispatchEvent(null).");

var dispatch_dispatch = async_test("If the event's dispatch flag is set, an InvalidStateError must be thrown.");
dispatch_dispatch.step(function() {
  var e = new Event("type", { bubbles: false, cancelable: false });

  var target = new EventTarget();
  target.addEventListener("type", dispatch_dispatch.step_func(function() {
    assert_throws_dom("InvalidStateError", function() {
      target.dispatchEvent(e);
    });
    assert_throws_dom("InvalidStateError", function() {
      dispatchEvent(e);
    });
  }), false);

  assert_equals(target.dispatchEvent(e), true, "dispatchEvent must return true");

  dispatch_dispatch.done();
});

test(function() {
  // https://www.w3.org/Bugs/Public/show_bug.cgi?id=17713
  // https://www.w3.org/Bugs/Public/show_bug.cgi?id=17714

  var e = new Event("type", { bubbles: false, cancelable: false });

  var called = [];

  var target = new EventTarget();
  target.addEventListener("type", function() {
    called.push("First");
    throw new Error();
  }, false);

  target.addEventListener("type", function() {
    called.push("Second");
  }, false);

  assert_equals(target.dispatchEvent(e), true, "dispatchEvent must return true");
  assert_array_equals(called, ["First", "Second"],
                      "Should have continued to call other event listeners");
}, "Exceptions from event listeners must not be propagated.");

async_test(function() {
  var results = [];
  var target = new EventTarget();
  target.addEventListener("x", this.step_func(function() {
    results.push(1);
  }), true);
  target.addEventListener("x", this.step_func(function() {
    results.push(2);
  }), false);
  target.addEventListener("x", this.step_func(function() {
    results.push(3);
  }), true);
  target.dispatchEvent(new Event("x"));
  assert_array_equals(results, [1, 3, 2]);
  this.done();
}, "Capturing event listeners should be called before non-capturing ones");
