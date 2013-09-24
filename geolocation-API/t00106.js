askAccept();
run(function() {
  geo.getCurrentPosition(
      function(position) {
        if (position
            && typeof position.coords == 'object'
            && (position.coords.heading == null || typeof position.coords.heading == 'number')) {
          pass();
        } else {
          fail();
        }
      },
      function(error) {
        maybe('INCONCLUSIVE: Failed to get a location.');
      });
});
