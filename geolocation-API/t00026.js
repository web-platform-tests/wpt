run(function() {
  if (typeof window.navigator.geolocation == 'object') {
    pass();
  } else {
    fail();
  }
});
