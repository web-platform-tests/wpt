askRefuse();
run(function() {
  geo.getCurrentPosition(
      unexpectedSuccessCallback,
      function (error) {
        if (error
            && typeof error == 'object'
            && error.PERMISSION_DENIED === 1
            && error.POSITION_UNAVAILABLE === 2
            && error.TIMEOUT === 3
            && typeof error.code == 'number'
            && typeof error.message == 'string') {
          pass();
        } else {
          fail();
        }
      });
});
