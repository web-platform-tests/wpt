<?php
	header("X-WebKit-CSP: default-src 'self'");
	header("X-Content-Security-Policy: default-src 'self'");
	header("Content-Security-Policy: default-src 'self'");
?>
<html>
<head>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
	<meta description="Content-Security-Policy Test: default-src: *" />
	<link rel="author" title="tanvi@mozilla.com" />
	<title> No inline script </title>
	<script src="http://www.w3c-test.org/resources/testharness.js"></script>
	<script src="http://www.w3c-test.org/resources/testharnessreport.js"></script>
</head>

<body>
	<div id=log></div>
	<script>
		unsafeScript=false;
	</script>
	<script src="assertTrue.php?varName=unsafeScript"></script>
</body>
