instruction('Clear all Geolocation permissions before running this test. If prompted for permission, please deny (permanently where applicable).');

run(function() {
  geo.getCurrentPosition(
      unexpectedSuccessCallback,
      function(error) {
        if (error.code == error.PERMISSION_DENIED) {
          instruction('Now revoke permissions for this origin (where applicable) and reload the page. PASS if you see the permission prompt again, ' + (isUsingPreemptivePermission ? 'INCONCLUSIVE if position acquisition fails, ' : '') + 'FAIL  otherwise');
        } else if (!isUsingPreemptivePermission && error.code == error.POSITION_UNAVAILABLE) {
          maybe('INCONCLUSIVE: position acquisition failed when not using preemptive permissions.');
        } else {
          unexpectedErrorCallback(error);
        }
      });
});
