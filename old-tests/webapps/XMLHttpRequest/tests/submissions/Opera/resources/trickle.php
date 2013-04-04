<?php
  // It will always output a text file for now with the literal string
  // "TEST_DELAY"
  $delay = ctype_digit($_GET["ms"]) ? $_GET["ms"] : 500;
  $count = ctype_digit($_GET["count"]) ? $_GET["count"] : 50;
  usleep($delay);
  header("Content-type: text/plain");
  usleep($delay);
  for( $i=0; $i<$count; $i++ ){
    echo "TEST_TRICKLE\n";
    flush();
    usleep($delay);
  }
  exit;
?>
