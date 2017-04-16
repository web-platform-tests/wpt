<?php
header("Content-type: text/javascript");
?>
(function ()
{
	test(function() {assert_true(false)}, "Script should not execute from "+document.location);
})()
