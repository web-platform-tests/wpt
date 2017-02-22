<?php
    header("Cache-Control: no-store");

    if ($_SERVER['REQUEST_METHOD'] == "POST") {
    	header("Access-Control-Allow-Credentials: true");
    	header("Access-Control-Allow-Origin: http://127.0.0.1:80");

    	header("Accept: " . $_SERVER['HTTP_ACCEPT']);
    	header("Accept-Language: " . $_SERVER['HTTP_ACCEPT_LANGUAGE']);
    	header("Content-Language: " . $_SERVER['HTTP_CONTENT_LANGUAGE']);
    	header("Content-Type: " . $_SERVER['CONTENT_TYPE']);

    } else {
    	echo "\n";
    }
?>

