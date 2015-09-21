importScripts("/resources/testharness.js");

async_test(function() {
  var file = new File(["bits"], "dummy", { 'type': 'text/plain', lastModified: 42 });

  var worker = new Worker("../support/worker-read-file-constructor.js");

  worker.onmessage = this.step_func(function(event) {
    assert_equals(event.data.name, file.name, "file name");
    assert_equals(event.data.content, "bits", "file content");
    assert_equals(event.data.lastModified, file.lastModified, "file lastModified");
    this.done();
  });

  worker.onerror = this.step_func(function(event) {
    assert_unreached(event.message);
  });
  worker.postMessage(file);

}, "FileReader in Worker");

