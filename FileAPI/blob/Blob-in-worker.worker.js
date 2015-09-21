importScripts("/resources/testharness.js");

async_test(function() {
  var data = "TEST";
  var worker = new Worker("../support/blob-in-worker.js");

  worker.onmessage = this.step_func(function(event) {
    assert_equals(event.data, data);
    this.done();
  });

  worker.onerror = this.step_func(function(event) {
    assert_unreached(event.message);
  });
  worker.postMessage(data);

}, "Create Blob in Worker");

