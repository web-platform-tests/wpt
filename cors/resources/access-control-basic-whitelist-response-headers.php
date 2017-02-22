<?php

#in whitelist
header("content-type: text/plain");
header("cache-control: no cache");
header("content-language: en");
header("expires: Fri, 30 Oct 1998 14:19:41 GMT");
header("last-modified: Tue, 15 Nov 1994 12:45:26 GMT");
header("pragma: no-cache");

#not in whitelist
header("x-webkit: foobar");

header("Access-Control-Allow-Origin: *");

echo "PASS: Cross-domain access allowed.";
?>

