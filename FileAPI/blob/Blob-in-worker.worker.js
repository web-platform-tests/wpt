importScripts("/resources/testharness.js");

promise_test(function() {
  return new Promise(function(resolve, reject) {
    var data = "TEST";
    var blob = new Blob([data], {type: "text/plain"});

    var reader = new FileReader();
    reader.onload = function (event) {
      var content = reader.result;
      assert_equals(content, data);
      resolve();
    };

    reader.onerror = function(event) {
      assert_unreached(event.error.message);
      reject(event.error.message);
    };
    reader.readAsText(blob);
  });
}, "Create Blob in Worker");

done();

