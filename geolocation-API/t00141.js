instruction('Clear all Geolocation permissions before running this test. If prompted for permission, please allow (permanently where applicable).');
function nextStep() {
  instruction('Now revoke permissions for this origin (where applicable) and reload the page. PASS if you see the permission prompt again, ' + (isUsingPreemptivePermission ? 'INCONCLUSIVE if position acquisition fails, ' : '') + 'FAIL  otherwise');
}

run(function() {
  geo.getCurrentPosition(
      nextStep,
      function(error) {
        if (error.code == error.POSITION_UNAVAILABLE) {
          if (isUsingPreemptivePermission) {
            nextStep();
          } else {
            maybe('INCONCLUSIVE: position acquisition failed when not using preemptive permissions.');
          }
        } else {
          unexpectedErrorCallback(error);
        }
      });
});
