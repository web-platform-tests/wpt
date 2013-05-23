<?php
header("Content-Security-Policy: default-src *");
header("X-Content-Security-Policy: default-src *");
header("X-WebKit-CSP: default-src *");
?>
<!DOCTYPE html>
<html>
	<head>
		<title>CSP Test: default-src: *</title>
		<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
		<meta descriptionn="Content-Security-Policy Test: default-src: *" />
		<link rel="author" title="bhill@paypal-inc.com" />
		<script src="http://www.w3c-test.org/resources/testharness.js"></script>
		<script src="http://www.w3c-test.org/resources/testharnessreport.js"></script>
		<script src="CSP_passTest001.php"></script>
	</head>
	<body>
		<div id=log></div>
	</body>

	<script>
		test(function() {assert_true(false)}, "assert_true with false from unsafe inline script");
	</script>
</html>
