<?php

if (isset($_GET["content"]))
{
    $output = $_GET["content"];
}
else
{
    $output = file_get_contents("php://input");
}

$output = gzencode($output, 9, FORCE_GZIP);

header("Content-type: text/plain");
header("Content-Encoding: gzip");
header("X-Request-Method: " . (isset($_SERVER["REQUEST_METHOD"]) ? $_SERVER["REQUEST_METHOD"] : "NO"));
header("X-Request-Query: " . (isset($_SERVER["QUERY_STRING"]) ? $_SERVER["QUERY_STRING"] : "NO"));
header("X-Request-Content-Length: " . (isset($_SERVER["CONTENT_LENGTH"]) ? $_SERVER["CONTENT_LENGTH"] : "NO"));
header("X-Request-Content-Type: " . (isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "NO"));
header("Content-Length: ".strlen($output));

echo $output;

exit;
?>