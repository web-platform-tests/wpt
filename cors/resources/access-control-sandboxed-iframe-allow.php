<?php

header("Content-Type: text/plain");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Origin: *");

echo "PASS: Sandboxed iframe XHR access allowed.";
?>

