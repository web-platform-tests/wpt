instruction('Clear all Geolocation permissions before running this test.');
maybe('PASS if you see a permission prompt including the host ' + window.location.hostname + ', FAIL otherwise.');
run(function() {
  geo.watchPosition(
      dummyFunction,
      function(error) {
        if (isUsingPreemptivePermission) {
          unexpectedErrorCallback(error);
        } else {
          maybe('INCONCLUSIVE: position acquisition failed when not using preemptive permissions.');
        }
      });
});
