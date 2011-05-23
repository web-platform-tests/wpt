<?php
  $session_user = $_SERVER["PHP_AUTH_USER"];
  $session_pass = $_SERVER["PHP_AUTH_PW"];
  $xhr_user = $_SERVER["HTTP_X_USER"];
  $xhr_pass = $_SERVER["HTTP_X_PASS"];
  $file = "authentication-temp-" . $xhr_user;
  if(
     (empty($session_user) && empty($session_pass))/* ||
     ($session_user != $xhr_user || $session_pass != $xhr_pass)*/
    ) {
    if(file_exists($file)) {
      unlink($file);
      echo 'FAIL (did not challenge)';
      exit;
    } else {
      $handler = fopen($file, 'w');
      fclose($handler);
      header('HTTP/1.1 401 Unauthorized');
      header('WWW-Authenticate: Basic realm="test"');
      echo 'FAIL (should be transparent)';
    }
  } else {
    if(!file_exists($file)) {
      echo 'FAIL (how did this happen?)';
    } else {
      unlink($file);
      echo $session_user . "\n" . $session_pass;
    }
  }
?>
