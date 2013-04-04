<?php
  $origin = isset($_GET['origin']) ? $_GET['origin'] : $_SERVER['HTTP_ORIGIN'];
  header("Access-Control-Allow-Origin: $origin");

  $credentials = isset($_GET['credentials']) ? $_GET['credentials'] : "true";
  if ($credentials != "none")
    header("Access-Control-Allow-Credentials: $credentials");

  switch($_GET['run']) {
    case "status-reconnect.php":
    case "message.php":
    case "redirect.php":
    case "cache-control.php":
      include($_GET['run']);
      break;
  }
?>
