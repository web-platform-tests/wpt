<?php

//Prevent Caching
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Type: text/javascript");

	print("(function () { if(typeof " . $_GET["varName"] . "=='undefined') {
				 test(function() {assert_true(true)}, \"assert_true with unsafeScript\"); 
		        	} else{
				   test(function() {assert_true(" . $_GET["varName"] . ")}, \"assert_true with unsafeScript defined when it shouldn't be\"); 
				}  })();");

?>

