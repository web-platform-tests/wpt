askAccept();
run(function() {
  geo.watchPosition(
      unexpectedSuccessCallback,
      function(error) {
        if (error.code == error.TIMEOUT) {
          pass();
        } else {
          unexpectedErrorCallback(error);
        }
      },
      {timeout: -1, maximumAge: 0});
});
