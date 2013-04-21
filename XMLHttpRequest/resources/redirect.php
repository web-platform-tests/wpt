<?php
  $code = ctype_digit($_GET["code"]) ? $_GET["code"] : "302";
  $location = $_GET["location"] ? $_GET["location"] : $_SERVER["SCRIPT_NAME"] . "?followed";

  if($_SERVER["QUERY_STRING"] == "followed") {
    header("Content:Type:text/plain");
    echo "MAGIC HAPPENED";
    exit;
  }

  header("HTTP/1.1 " . $code . " WEBSRT MARKETING");
  header("Location: " . $location);
  echo "TEST";
  exit;
?>
