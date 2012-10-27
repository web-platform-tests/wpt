<?php
  $mime = $_GET["mime"] ? $_GET["mime"] : "text/event-stream";
  $message = $_GET["message"] ? $_GET["message"] : "data: data";
  $newline = $_GET["newline"] ? ($_GET["newline"] == "none" ? "" : $_GET["newline"]) : "\n\n";
  header("Content-Type: " . $mime);
  echo $message . $newline;
?>

