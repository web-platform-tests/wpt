<?php
 header("Content-type: text/plain");
 header("X-Request-Method: " . (isset($_SERVER["REQUEST_METHOD"]) ? $_SERVER["REQUEST_METHOD"] : "NO"));
 header("X-Request-Query: " . (isset($_SERVER["QUERY_STRING"]) ? $_SERVER["QUERY_STRING"] : "NO"));
 header("X-Request-Content-Length: " . (isset($_SERVER["CONTENT_LENGTH"]) ? $_SERVER["CONTENT_LENGTH"] : "NO"));
 header("X-Request-Content-Type: " . (isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "NO"));
 echo file_get_contents("php://input");
 exit;
?>
