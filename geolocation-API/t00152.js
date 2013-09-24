askAccept();
run(function() {
  geo.getCurrentPosition(
      function(position) {
        if (position
            && typeof position.coords == 'object'
            && typeof position.coords.latitude == 'number'
            && typeof position.coords.longitude == 'number') {
          pass();
        } else {
          fail();
        }
      },
      function(error) {
        maybe('INCONCLUSIVE: Failed to get a location.');
      });
});
