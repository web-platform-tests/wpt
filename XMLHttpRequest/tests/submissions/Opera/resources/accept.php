<?php
  header("Content-Type:text/plain");
  echo isset($_SERVER["HTTP_ACCEPT"]) ? $_SERVER["HTTP_ACCEPT"] : "NO";
  exit;
?>
