<?php
  header("Content-Type:text/plain");
  echo isset($_SERVER["HTTP_ACCEPT_LANGUAGE"]) ? $_SERVER["HTTP_ACCEPT_LANGUAGE"] : "NO";
  exit;
?>
