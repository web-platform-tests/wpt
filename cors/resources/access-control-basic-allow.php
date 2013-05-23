<?php

header("Content-Type: text/plain");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Origin:" . $_SERVER['HTTP_ORIGIN']);

echo "PASS: Cross-domain access allowed.";

?>

