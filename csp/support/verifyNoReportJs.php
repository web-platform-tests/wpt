<?php

//Prevent Caching
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Type: text/javascript");

$cleanQuotedCookieId = json_encode($_GET['reportID']);
$cleanReportField = json_encode($_GET['reportField']);
$cleanReportValue = json_encode($_GET['reportValue']);

?>

(function () 
{ 

 function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	undefined}
	return null;
}

 function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

  function eraseCookie(name) {
	createCookie(name,"",-1);
}

function reportdecode (str) {

  if(str!= null){ str = str.replace(/"/g, '$'); }

  return decodeURIComponent((str + '').replace(/\+/g, '%20'));
}
 test(function() {

	var x = reportdecode(readCookie(<?php echo $cleanQuotedCookieId ?>));
	assert_equals(x, "null");
	eraseCookie(<?php echo $cleanQuotedCookieId ?>);

}, "Verified no report sent.");

})();

