<?php
    header("Content-Type: text/plain");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Origin: http://127.0.0.1:80");

    echo "FAIL: Sandboxed iframe XHR access allowed.";

?>
