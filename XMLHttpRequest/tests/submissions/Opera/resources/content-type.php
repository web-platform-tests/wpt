<?php
 $ctype='';
 if(isset($_REQUEST['content-type']))$ctype=$_REQUEST['content-type'];
 header("Content-type: ".$ctype);
 header("X-Request-Method: " . (isset($_SERVER["REQUEST_METHOD"]) ? $_SERVER["REQUEST_METHOD"] : "NO"));
 header("X-Request-Query: " . (isset($_SERVER["QUERY_STRING"]) ? $_SERVER["QUERY_STRING"] : "NO"));
 header("X-Request-Content-Length: " . (isset($_SERVER["CONTENT_LENGTH"]) ? $_SERVER["CONTENT_LENGTH"] : "NO"));
 header("X-Request-Content-Type: " . (isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "NO"));
 if(isset($_REQUEST['content'])){
  echo $_REQUEST['content'];
 }else{
  echo file_get_contents("php://input");
 }
?>
