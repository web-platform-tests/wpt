<?php
header("Content-Security-Policy: default-src 'self'");
header("X-Content-Security-Policy: default-src 'self'");
header("X-WebKit-CSP: default-src 'self'");
?>
<!DOCTYPE html>
<html>
<head>
<title>CSP Test: default-src 'self' about: 'unsafe-inline'</title>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<meta descriptionn="Content-Security-Policy Test: default-src 'self' about: 'unsafe-inline'" />
<link rel="author" title="abarth" />
<script src="http://www.w3c-test.org/resources/testharness.js"></script>
<script src="http://www.w3c-test.org/resources/testharnessreport.js"></script>
</head>
<div id="log"></div>
<script src="resources/pass.js"></script>
<script>
test(function() {assert_true(false)}, 'Inline scripts run (1 of 3)');
</script>
<iframe style="display:none" src="javascript:parent.test(function() {parent.assert_true(false)}, 'JavaScript URLs run (2 of 3)');"></iframe>
<img style="display:none"
     onerror="test(function() {assert_true(false)}, 'Inline event handlers run (3 of 3)')"
     src="about:blank">
</body>
</html>
