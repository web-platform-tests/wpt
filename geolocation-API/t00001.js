askRefuse();
run(function() {
  geo.getCurrentPosition(
      unexpectedSuccessCallback,
      function(error) {
        if (error.code == error.PERMISSION_DENIED
            || (!isUsingPreemptivePermission && error.code == error.POSITION_UNAVAILABLE)) {
          expectedErrorCallback(error);
        } else {
          fail('Error callback invoked with incorrect error code ' + error.code);
        }
      });
});
