<?php
  $mime = !empty($_GET["mime"]) ? $_GET["mime"] : "text/event-stream";
  $message = !empty($_GET["message"]) ? $_GET["message"] : "data: data";
  $newline = !empty($_GET["newline"]) ? ($_GET["newline"] == "none" ? "" : $_GET["newline"]) : "\n\n";
  $sleep = !empty($_GET["sleep"]) ? intval($_GET["sleep"]) : 0;
  header("Content-Type: " . $mime);
  echo $message . $newline;
  echo "\n";
  usleep($sleep * 1000);
  exit();
?>
