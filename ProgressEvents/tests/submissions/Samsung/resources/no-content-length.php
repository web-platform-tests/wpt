<?php
    header('Content-Encoding', 'chunked');
    header('Transfer-Encoding', 'chunked');
    header('Content-Type', 'text/html');
    header('Connection', 'keep-alive');

    ob_flush();
    flush();

    for ($i = 0; $i < 100000; $i++) {
        $string = "W3C Progress Events Test";
        echo strlen($string)."\r\n"; // this is the length
        echo $string."\r\n"; // this is the date
        echo "\r\n"; // newline between chunks
        ob_flush(); // rinse and repeat
        flush();
    } 
    echo  "\r\n"; // send final empty line
    ob_flush();
    flush();
?>

