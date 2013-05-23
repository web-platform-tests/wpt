<?php
header("Content-Security-Policy: default-src 'self'");
header("X-Content-Security-Policy: default-src 'self'");
header("X-WebKit-CSP: default-src 'self'");
?>
<!DOCTYPE html>
<html>
	<head>
		<title>CSP Test: default-src: 'self'</title>
		<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
		<meta description="Content-Security-Policy Test: default-src: 'self'" />
		<link rel="author" title="bhill@paypal-inc.com" />
		<script src="/resources/testharness.js"></script>
		<script src="/resources/testharnessreport.js"></script>
		<script src="CSP_passTest001.php"></script>
	</head>
	<body>
		<div id=log></div>
	</body>

	<script>
		test(function() {assert_true(false)}, "assert_true with false from unsafe inline script");
	</script>
</html>
