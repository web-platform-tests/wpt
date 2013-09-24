askAccept();
run(function() {
  geo.getCurrentPosition(
      function(position) {
        if (position
            && typeof position.coords == 'object'
            && (position.coords.speed == null || typeof position.coords.speed == 'number')) {
          pass();
        } else {
          fail();
        }
      },
      function(error) {
        maybe('INCONCLUSIVE: Failed to get a location.');
      });
});
