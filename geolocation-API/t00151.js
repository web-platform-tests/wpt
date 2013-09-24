run(function() {
  var id = geo.watchPosition(dummyFunction);
  if (typeof id === 'number' && id >= -2147483648 && id <= 2147483647) {
    pass();
  } else {
    fail();
  }
});
