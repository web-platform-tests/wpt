askAccept();
run(function() {
  geo.getCurrentPosition(
      function(position) {
        if (position
            && (typeof position.timestamp == 'object' || typeof position.timestamp == 'number')
            && position.timestamp <= new Date()) {
          pass();
        } else {
          fail();
        }
      },
      function(error) {
        maybe('INCONCLUSIVE: Failed to get a location.');
      });
});
