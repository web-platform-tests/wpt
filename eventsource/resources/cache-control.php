<?php
  header("Content-Type:text/event-stream");
  echo "data: " . $_SERVER["HTTP_CACHE_CONTROL"] . "\n\n";
?>

