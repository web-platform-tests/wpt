<?php
  // Hack for PHP
  function stripslashes_recursive($var) {
    foreach($var as $i => $value)
      $var[$i] = stripslashes($value);
    return $var;
  }
  if(get_magic_quotes_gpc()) {
    $_GET = stripslashes_recursive($_GET);
  }

  // This should reasonably work for most response codes.
  $code = ctype_digit($_GET["code"]) ? $_GET["code"] : "200";
  $text = $_GET["text"] ? $_GET["text"] : "OMG";
  $content = $_GET["content"] ? $_GET["content"] : "";
  $type = $_GET["type"] ? $_GET["type"] : "";
  header("HTTP/1.1 " . $code . " " . $text);
  header("Content-Type:" . $type);
  echo $content;
  exit;
?>
