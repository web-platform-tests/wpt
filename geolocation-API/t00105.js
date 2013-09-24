askAccept();
run(function() {
  geo.getCurrentPosition(
      function(position) {
        if (position
            && typeof position.coords == 'object'
            && (position.coords.altitudeAccuracy == null || typeof position.coords.altitudeAccuracy == 'number')) {
          pass();
        } else {
          fail();
        }
      },
      function(error) {
        maybe('INCONCLUSIVE: Failed to get a location.');
      });
});
