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
  geo.watchPosition(checkMethodHasReturned, checkMethodHasReturned);
  hasMethodReturned = true;
});
