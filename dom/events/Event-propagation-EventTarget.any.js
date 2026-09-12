// META: title=Event propagation tests

// Author: Aryeh Gregor <ayg@aryeh.name>

// This is a copy of the test in Event-propagation-dom-node.window.js, but on a
// plain EventTarget instead of a DOM node. The difference is that EventTarget
// doesn't have bubbling/capture behaviour, so the expectations after
// stopPropagation() and cancelBubble=true are different.

"use strict";

var target = new EventTarget();

function testPropagationFlag(ev, expected, desc) {
  test(function() {
    var called = false;
    var callback = function() { called = true };
    this.add_cleanup(function() {
      target.removeEventListener("foo", callback)
    });
    target.addEventListener("foo", callback);
    target.dispatchEvent(ev);
    assert_equals(called, expected, "Propagation flag");
    // dispatchEvent resets the propagation flags so it will happily dispatch
    // the event the second time around.
    target.dispatchEvent(ev);
    assert_equals(called, true, "Propagation flag after first dispatch");
  }, desc);
}

var ev = new Event("foo", { bubbles: true, cancelable: false });
testPropagationFlag(ev, true, "Newly-created Event");
ev.stopPropagation();
testPropagationFlag(ev, true, "After stopPropagation()");
ev.initEvent("foo", true, false);
testPropagationFlag(ev, true, "Reinitialized after stopPropagation()");

var ev = new Event("foo", { bubbles: true, cancelable: false });
ev.stopImmediatePropagation();
testPropagationFlag(ev, false, "After stopImmediatePropagation()");
ev.initEvent("foo", true, false);
testPropagationFlag(ev, true, "Reinitialized after stopImmediatePropagation()");

var ev = new Event("foo", { bubbles: true, cancelable: false });
ev.cancelBubble = true;
testPropagationFlag(ev, true, "After cancelBubble=true");
ev.initEvent("foo", true, false);
testPropagationFlag(ev, true, "Reinitialized after cancelBubble=true");
