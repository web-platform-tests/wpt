<?php
    header('Transfer-Encoding', 'chunked');
    header('Content-Type', 'text/html');
    header('Connection', 'keep-alive');

    for ($i = 0; $i < 100000; $i++) {
        $string = "W3C";
        echo strlen($string)."\r\n";
        echo $string."\r\n";
        flush();
    }

    $string = "";
    echo strlen($string)."\r\n";
    echo  "\r\n"; // send final empty line
    flush();
?>

