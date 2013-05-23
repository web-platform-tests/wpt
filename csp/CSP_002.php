<?php
$policy_string = "default-src 'self'";
header("Content-Security-Policy: $policy_string");
if($_GET['prefixed'] == 'true') {
	header("X-Content-Security-Policy: $policy_string");
	header("X-Webkit-CSP: $policy_string");
}
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
	<h1>Verify that inline script does not run when a CSP specifies "default-src: 'self'" but not 'unsafe-inline'.</h1>

		<div id=log></div>
	</body>

	<script>
		test(function() {assert_false(true, "Unsafe unline script ran.")});
	</script>
</html>
