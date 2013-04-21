<?php
  $tag = isset($_GET["tag"]) ? $_GET["tag"] : "";
  $match = isset($_SERVER["HTTP_IF_NONE_MATCH"]) ? $_SERVER["HTTP_IF_NONE_MATCH"] : "";
  $date = isset($_GET["date"]) ? $_GET["date"] : "";
  $modified = isset($_SERVER["HTTP_IF_MODIFIED_SINCE"]) ? $_SERVER["HTTP_IF_MODIFIED_SINCE"] : "";
  if(!empty($tag)) {
    header("ETag: \"" . $tag . "\"");
  } elseif(!empty($date)) {
    header("Last-Modified: " . $date);
  }
  if((!empty($match) && $match == $tag) ||
     (!empty($modified) && $modified == $date)) {
    header("HTTP/1.1 304 SUPERCOOL");
    exit;
  }
  header("Content-Type:text/plain");
  echo "MAYBE NOT";
  exit;
?>
