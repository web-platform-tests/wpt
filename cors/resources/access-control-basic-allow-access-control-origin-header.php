<?php

header("Content-Type: text/plain");
header("Cache-Control: no-cache, no-store");
header("Access-Control-Allow-Origin: *");

echo "PASS: Cross-domain access allowed.\n";
echo "HTTP_ORIGIN: " .  $_SERVER["HTTP_ORIGIN"] . "\n"

?>

