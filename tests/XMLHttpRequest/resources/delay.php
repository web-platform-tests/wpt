<?php
  // It will always output a text file for now with the literal string
  // "TEST_DELAY"
  $delay = ctype_digit($_GET["ms"]) ? $_GET["ms"] : 500;
  usleep($delay);
  header("Content-type: text/plain");
  echo "TEST_DELAY";
  exit;
?>
