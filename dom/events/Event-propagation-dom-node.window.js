// META: title=Event propagation tests (DOM node)

// Author: Aryeh Gregor <ayg@aryeh.name>

"use strict";

function testPropagationFlag(ev, expected, desc) {
  test(function() {
    var called = false;
    var callback = function() { called = true };
    this.add_cleanup(function() {
      document.head.removeEventListener("foo", callback)
    });
    document.head.addEventListener("foo", callback);
    document.head.dispatchEvent(ev);
    assert_equals(called, expected, "Propagation flag");
    // dispatchEvent resets the propagation flags so it will happily dispatch
    // the event the second time around.
    document.head.dispatchEvent(ev);
    assert_equals(called, true, "Propagation flag after first dispatch");
  }, desc);
}

var ev = document.createEvent("Event");
ev.initEvent("foo", true, false);
testPropagationFlag(ev, true, "Newly-created Event");
ev.stopPropagation();
testPropagationFlag(ev, false, "After stopPropagation()");
ev.initEvent("foo", true, false);
testPropagationFlag(ev, true, "Reinitialized after stopPropagation()");

var ev = document.createEvent("Event");
ev.initEvent("foo", true, false);
ev.stopImmediatePropagation();
testPropagationFlag(ev, false, "After stopImmediatePropagation()");
ev.initEvent("foo", true, false);
testPropagationFlag(ev, true, "Reinitialized after stopImmediatePropagation()");

var ev = document.createEvent("Event");
ev.initEvent("foo", true, false);
ev.cancelBubble = true;
testPropagationFlag(ev, false, "After cancelBubble=true");
ev.initEvent("foo", true, false);
testPropagationFlag(ev, true, "Reinitialized after cancelBubble=true");
