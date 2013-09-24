askAccept();
run(function() {
  geo.getCurrentPosition(
      expectedSuccessCallback,
      function(error) {
        if (!isUsingPreemptivePermission && error.code == error.POSITION_UNAVAILABLE) {
          expectedErrorCallback(error);
        } else {
          unexpectedErrorCallback(error);
        }
      });
});
