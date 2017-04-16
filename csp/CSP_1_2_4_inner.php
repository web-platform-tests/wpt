<?php

header("Content-Type: application/xml");

/*****
* First, some generic setup.  It is good to define the policy string as a variable once
* as we are likely to need to reference it later in describing the policy and checking
* reports.  For the same reason, we set the report-uri as a distinct variable and 
* combine it to form the full CSP header.
*****/
$policy_string = "script-src http://www2.w3c-test.org";
$title = "XSLT should not run with policy \"$policy_string\".";

/*****
* The support script setReportAsCookie.php will echo the contents of the CSP report
* back as a cookie.  Note that you can't read this value immediately in this context
* because the reporting is asynchronous and non-deterministic. As a rule of thumb,
* you can test it in an iframe. 
*****/
$reportID=$_GET['reportID'];
$report_string = "report-uri support/setReportAsCookie.php?reportID=$reportID";

header("Content-Security-Policy: $policy_string; $report_string");
/*****
* Run tests with prefixed headers if requested.
* Note this will not really work for Mozilla, as they use
* the old, pre-1.0 directive grammar and vocabulary
*****/
if($_GET['prefixed'] == 'true') {
	header("X-Content-Security-Policy: $policy_string; $report_string");
	header("X-Webkit-CSP: $policy_string; $report_string");
}
?>
<?php echo <<< EOXMLD
<?xml-stylesheet type="text/xsl" href="support/test.xsl.php"?>
EOXMLD;
?>

<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<!-- Yes, this metadata is important in making these test cases useful
		in assessing conformance.  Please preserve and update it. -->
		<title><?php echo $title ?></title>
		<!--meta description='<?php echo $title ?>' /-->
		<link rel="author" title="bhill@paypal-inc.com" />
		<script src="http://www2.w3c-test.org/resources/testharness.js"></script>
		<script src="http://www2.w3c-test.org/resources/testharnessreport.js"></script>
	</head>
	<body>
		<div id="log"></div>

	<!-- Often when testing CSP you want something *not* to happen. Including this support script
	(from an allowed source!) will give you and the test runner a guaranteed positive signal that
	something is happening.  -->
	<script src="http://www2.w3c-test.org/webappsec/tests/csp/submitted/WG/support/fail.php"></script>

	</body>
</html>
