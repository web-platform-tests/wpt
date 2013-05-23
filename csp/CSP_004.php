<?php
$policy_string = "script-src 'self' 'unsafe-inline'";
header("Content-Security-Policy: $policy_string");
if($_GET['prefixed'] == 'true') {
	header("X-Content-Security-Policy: $policy_string");
	header("X-Webkit-CSP: $policy_string");
}
?>
<!DOCTYPE html>
<html>
	<head>
		<title>CSP Test: script-src 'self' 'unsafe-inline'</title>
		<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
		<meta description="Content-Security-Policy Test: script-src 'self' 'unsafe-inline'" />
		<link rel="author" title="bhill@paypal-inc.com" />
		<script src="/resources/testharness.js"></script>
		<script src="/resources/testharnessreport.js"></script>
	</head>
	<body>
<h1>Test that an inline script block executes when policy is: "script-src 'self' 'unsafe-inline'"</h1>

		<div id=log></div>
	</body>
	<!--
		This test demonstrates how to test something that shouldn't happen, or 
		fail when something that should happend doesn't.  Use script with
		conditional execution based on the policy being tested to set a variable,
		then use script we know will execute by policy to check if it is set.
		
		Some limitations on this approach, obviously, if policy enforcement is
		very broken - when we can't count on any script to execute - but this
		is a start, at least.
	-->	

	<script>
		var unsafeScript = true;
	</script>

	<script src="assertTrue.php?varName=unsafeScript"></script>
</html>
