<?php
  $status = $_GET["status"] ? $_GET["status"] : "204";
  $id = $_GET["id"] ? $_GET["id"] : $status;

  if($_COOKIE["request" . $id] == $status) {
    header("Content-Type: text/event-stream");
    setcookie("request" . $id, "");
    echo "data: data\n\n";
  } else {
    header("HTTP/1.1 " . $status . " TEST");
    setcookie("request" . $id, $status);
    header("Content-Type: text/event-stream");
    echo "retry: 2\n";
    if (isset($_GET["ok_first"]))
      echo "data: ok\n\n";
  }
?>

