importScripts("/resources/testharness.js");
importScripts("rsa_vectors.js");
importScripts("rsa.js");

run_test();

// Give all the promise_tests a little time, then tell the framework we're done.
step_timeout(function() {done();}, 1000);
