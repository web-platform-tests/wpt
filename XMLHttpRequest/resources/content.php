<?php
$response_charset_label = '';
if(isset($_GET['response_charset_label']))$response_charset_label = ';charset='.$_GET['response_charset_label'];
 header("Content-type: text/plain".$response_charset_label);
 header("X-Request-Method: " . (isset($_SERVER["REQUEST_METHOD"]) ? $_SERVER["REQUEST_METHOD"] : "NO"));
 header("X-Request-Query: " . (isset($_SERVER["QUERY_STRING"]) ? $_SERVER["QUERY_STRING"] : "NO"));
 header("X-Request-Content-Length: " . (isset($_SERVER["CONTENT_LENGTH"]) ? $_SERVER["CONTENT_LENGTH"] : "NO"));
 header("X-Request-Content-Type: " . (isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "NO"));
if (isset($_GET["content"]))
{
    echo $_GET["content"];
}
else
{
    echo file_get_contents("php://input");
}
exit;
?>