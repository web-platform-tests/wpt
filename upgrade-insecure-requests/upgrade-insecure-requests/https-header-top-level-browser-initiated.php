<!DOCTYPE html>
<html>
<head>
  <script src="/resources/testharness.js"></script>
  <script src="/resources/testharnessreport.js"></script>
  <script>
    test(function () {
      <?php echo "httpsHeader = \"", $_SERVER['HTTP_UPGRADE_INSECURE_REQUESTS'], "\";" ?>;
      assert_equals(httpsHeader, "1");
    }, "Verify that the browser-initiated request was delivered with an 'Upgrade-Insecure-Requests' header.");
  </script>
</head>
</html>
