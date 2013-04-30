<?php
  header("Content-Type: text/event-stream");
  echo "data: " . $_SERVER["HTTP_ACCEPT"] . "\n\n";
?>

