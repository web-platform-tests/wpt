<?php
    header("Content-Type: text/plain");
    header("Cache-Control: no-store");
    header("Access-Control-Allow-Origin: *");

    foreach($_SERVER as $h=>$v)
     if(ereg('HTTP_(.+)',$h,$hp))
       echo "$h = $v\n";

?>
