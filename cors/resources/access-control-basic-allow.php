<?php
header("Content-Type: text/plain");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Origin: http://w3c-test.org");
echo "PASS: Cross-domain access allowed.";
?>