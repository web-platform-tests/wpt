importScripts("/resources/testharness.js");
importScripts("aes_cbc_vectors.js");
importScripts("aes_cbc.js");

run_test();

// Give all the promise_tests a little time, then tell the framework we're done.
step_timeout(function() {done();}, 1000);
