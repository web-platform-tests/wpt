<?php
  $status = ctype_digit($_GET["status"]) ? $_GET["status"] : 302;
  header("Location: message.php", true, $status);
?>

