instruction('Respond to any permission prompt that appears.');
run(function() {
  var hasMethodReturned = false;
  function checkMethodHasReturned() {
    if (hasMethodReturned) {
      pass();
    } else {
      fail();
    }
  }
  geo.getCurrentPosition(checkMethodHasReturned, checkMethodHasReturned);
  hasMethodReturned = true;
});
