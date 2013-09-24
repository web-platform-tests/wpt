askAccept();
run(function() {
  geo.getCurrentPosition(
      function(position) {
        if (position
            && typeof position.coords == 'object'
            && (position.coords.altitude == null || typeof position.coords.altitude == 'number')) {
          pass();
        } else {
          fail();
        }
      },
      function(error) {
        maybe('INCONCLUSIVE: Failed to get a location.');
      });
});
