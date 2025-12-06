// META: title=XMLHttpRequest: status and statusText - async requests
// META: script=/resources/testharness.js
// META: script=/resources/testharnessreport.js

async_test(function(t) {
  var xhr = new XMLHttpRequest();
  
  xhr.onload = t.step_func_done(function() {
    assert_equals(xhr.status, 200, "status should be 200");
    assert_equals(xhr.statusText, "OK", "statusText should be OK");
  });
  
  xhr.onerror = t.unreached_func("Should not get an error");
  
  xhr.open("GET", "resources/content.py", true);
  xhr.send();
}, "XMLHttpRequest status and statusText for successful async GET request");
