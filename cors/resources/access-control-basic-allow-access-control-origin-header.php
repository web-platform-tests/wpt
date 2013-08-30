<?php
header("Content-Type: text/plain");
header("Cache-Control: no-cache, no-store\n");
header("Access-Control-Allow-Origin: *\n\n");
echo "PASS: Cross-domain access allowed.";
echo "HTTP_ORIGIN: " . $ENV{"HTTP_ORIGIN"} . "\n";
?>