<?php

//Prevent Caching
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Type: text/html");

?>
<!DOCTYPE html>
<html>
	<head>
		<script src="http://www.w3c-test.org/resources/testharness.js"></script>
		<script src="http://www.w3c-test.org/resources/testharnessreport.js"></script>
		<script src="verifyNoReportJs.php?reportID=<?php echo urlencode($_GET['reportID']) ?>&reportField=<?php echo urlencode($_GET['reportField']) ?>&reportValue=<?php echo $_GET['reportValue'] ?>"></script>
	</head>
	<body>
		<div id=log></div>
	<body>
</html>
