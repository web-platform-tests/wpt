// META: title=Event.defaultPrevented is not reset after dispatchEvent()

// There is another version of this test depending on document.createEvent() and
// DOM elements, in Event-defaultPrevented-after-dispatch-createEvent.html.

test(function() {
    var EVENT = "foo";
    var TARGET = new EventTarget();
    var evt = new Event(EVENT, { bubbles: true, cancelable: true });

    TARGET.addEventListener(EVENT, this.step_func(function(e) {
        e.preventDefault();
        assert_true(e.defaultPrevented, "during dispatch");
    }), true);
    TARGET.dispatchEvent(evt);

    assert_true(evt.defaultPrevented, "after dispatch");
    assert_equals(evt.target, TARGET);
    assert_equals(evt.srcElement, TARGET);
}, "Default prevention via preventDefault");

test(function() {
    var EVENT = "foo";
    var TARGET = new EventTarget();
    var evt = new Event(EVENT, { bubbles: true, cancelable: true });

    TARGET.addEventListener(EVENT, this.step_func(function(e) {
        e.returnValue = false;
        assert_true(e.defaultPrevented, "during dispatch");
    }), true);
    TARGET.dispatchEvent(evt);

    assert_true(evt.defaultPrevented, "after dispatch");
    assert_equals(evt.target, TARGET);
    assert_equals(evt.srcElement, TARGET);
}, "Default prevention via returnValue");
