<?php
  // mark this resource as super-CORS-friendly..
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, POST, PUT, FOO');
  header('Access-Control-Allow-Headers: x-test, x-foo');
  header('Access-Control-Expose-Headers: x-request-method, x-request-content-type, x-request-query, x-request-content-length');
  if(isset($_GET['delay'])){
  	sleep($_GET['delay']);
  }
 header("X-Request-Method: " . (isset($_SERVER["REQUEST_METHOD"]) ? $_SERVER["REQUEST_METHOD"] : "NO"));
 header("X-Request-Query: " . (isset($_SERVER["QUERY_STRING"]) ? $_SERVER["QUERY_STRING"] : "NO"));
 header("X-Request-Content-Length: " . (isset($_SERVER["CONTENT_LENGTH"]) ? $_SERVER["CONTENT_LENGTH"] : "NO"));
 header("X-Request-Content-Type: " . (isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "NO"));
?>
