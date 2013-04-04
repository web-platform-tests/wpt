<?php
  $id = "recon_fail_" . $_GET["id"];

  switch($_COOKIE[$id]) {
    case 'opened':
      header("HTTP/1.1 200 RECONNECT");
      header("Content-Type: text/event-stream");
      setcookie($id, "reconnected");
      echo "data: reconnected\n\n";
      break;

    case 'reconnected':
      header("HTTP/1.1 204 NO CONTENT (CLOSE)");
      header("Content-Type: text/event-stream");
      setcookie($id, ""); // Delete cookie
      echo "data: closed\n\n"; // Will never get through
      break;

    default:
      header("HTTP/1.1 200 OPEN");
      header("Content-Type: text/event-stream");
      setcookie($id, "opened");
      echo "retry: 2\n";
      echo "data: opened\n\n";
  }

?>

