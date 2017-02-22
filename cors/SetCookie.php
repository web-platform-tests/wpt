<?php
//Prevent Caching
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

//Set Cookie
header("Access-Control-Allow-Origin: *");
header("Set-Cookie: cookieName=cookieValue");

print("'Set-Cookie: cookieName=cookieValue' Sent in HTTP Response Header");
?>