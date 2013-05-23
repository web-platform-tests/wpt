<?php
header("Content-Type: text/plain");

if($_SERVER['REQUEST_METHOD'] == 'OPTIONS')
{
    if(!isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
	die("ERROR: No access-control-request-method in preflight!");

    header("Access-Control-Allow-Headers: x-print, " .
            "{$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    if (isset($_GET['max_age']))
        header("Access-Control-Max-Age: {$_GET['max_age']}");

    include("log.php");
}
header("Access-Control-Allow-Origin: *");

$p = isset($_SERVER['HTTP_X_PRINT']) ? $_SERVER['HTTP_X_PRINT'] : "NO";
echo $p;
