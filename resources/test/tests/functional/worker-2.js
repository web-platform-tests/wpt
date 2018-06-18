importScripts("/resources/testharness.js");

test(
    function(test) {
        assert_true(true, "True is true");
    },
    "Worker test that completes successfully (from worker-2.js)");

// An explicit done() is required for dedicated and shared web workers.
done();
