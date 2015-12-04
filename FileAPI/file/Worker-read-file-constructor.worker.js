importScripts("/resources/testharness.js");

promise_test(function() {
  return new Promise(function(resolve, reject) {
    var file = new File(["bits"], "dummy", { 'type': 'text/plain', lastModified: 42 });

    var reader = new FileReader();
    reader.onload = function (event) {
      var content = reader.result;
      assert_equals(file.name, "dummy", "file name");
      assert_equals(content, "bits", "file content");
      assert_equals(file.lastModified, 42, "file lastModified");
      resolve();
    };

    reader.onerror = function(event) {
      assert_unreached(event.error.message);
      reject(event.error.message);
    };
    reader.readAsText(file);
  });
}, "FileReader in Worker");

done();
