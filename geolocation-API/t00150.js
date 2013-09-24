function hasGeolocationProperty() {
  for (var property in window.navigator) {
    if (property == 'geolocation') {
      return true;
    }
  }
  return false;
}

run(function() {
  if (hasGeolocationProperty() && 'geolocation' in window.navigator) {
    pass();
  } else {
    fail();
  }
});
