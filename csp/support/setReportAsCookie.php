<?php
error_reporting(~0); ini_set('display_errors',1);
//Prevent Caching
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Type: text/javascript");

header("Set-Cookie: " . $_GET['reportID'] . "=" . urlencode(file_get_contents('php://input')) . "; Path=/;");
?>
