importScripts("/resources/testharness.js");

test(function() {
  self.onmessage = 1;
  assert_equals(self.onmessage, null);
}, "Setting onmessage to 1");

test(function() {
  self.onmessage = {handleEvent:function(){}};
  assert_equals(self.onmessage, null);
}, "Setting onmessage to an object");

test(function() {
  var f = function(e) {};
  self.onmessage = f;
  assert_equals(self.onmessage, f);
}, "Setting onmessage to a function");

done();
