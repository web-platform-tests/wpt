<?php

  header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
  header("Access-Control-Expose-Headers: X-Request-Method");
  if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS')
    header("Access-Control-Allow-Methods: GET, CHICKEN, HEAD, POST, PUT");
  if (isset($_GET['headers']))
    header("Access-Control-Allow-Headers: {$_GET['headers']}");
  header("X-Request-Method: " .
    (isset($_SERVER["REQUEST_METHOD"]) ? $_SERVER["REQUEST_METHOD"] : ""));
  header("X-A-C-Request-Method: " .
    (isset($_SERVER["HTTP_ACCESS_CONTROL_REQUEST_METHOD"])
      ? $_SERVER["HTTP_ACCESS_CONTROL_REQUEST_METHOD"] : ""));

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
  $code = isset($_GET['code']) && ctype_digit($_GET["code"]) ? $_GET["code"] : "200";
  $text = isset($_GET["text"]) ? $_GET["text"] : "OMG";

  if (isset($_GET['preflight'])
      && ctype_digit($_GET['preflight'])
      && $_SERVER['REQUEST_METHOD'] == 'OPTIONS')
    $code = $_GET['preflight'];

  header("HTTP/1.1 " . $code . " " . $text);

  if (isset($_GET['type']))
    header("Content-Type:" . $_GET['type']);
  if (isset($_GET["content"]))
    echo $_GET['content'];
?>
