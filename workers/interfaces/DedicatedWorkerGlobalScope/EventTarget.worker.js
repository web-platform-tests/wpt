importScripts("/resources/testharness.js");

test(function() {
    addEventListener("message", this.step_func(function listener(evt) {
        removeEventListener("message", listener, true);
    }), true);
    self.dispatchEvent(new Event("message"));
    self.dispatchEvent(new Event("message"));
}, "removeEventListener");

test(function() {
    addEventListener("message", this.step_func(function(evt) {
        assert_equals(evt.target, self);
    }), true);
    self.dispatchEvent(new Event("message"));
}, "target");

done();
