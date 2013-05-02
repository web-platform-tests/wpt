<?php
  if (isset($_GET['logout'])) {
    header('HTTP/1.1 401 Unauthorized');
    header('WWW-Authenticate: Basic realm="test"');
    die("Logged out, hopefully");
  }

  $session_user = isset($_SERVER["PHP_AUTH_USER"]) ? $_SERVER["PHP_AUTH_USER"] : null;
  $session_pass = isset($_SERVER["PHP_AUTH_PW"]) ? $_SERVER["PHP_AUTH_PW"] : null;
  $xhr_user = isset($_SERVER["HTTP_X_USER"]) ? $_SERVER["HTTP_X_USER"] : null;
  $xhr_pass = isset($_SERVER["HTTP_X_PASS"]) ? $_SERVER["HTTP_X_PASS"] : null;
  $file = "authentication-temp-" . $xhr_user;
  if((empty($session_user) && empty($session_pass))/* ||
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
      header('XHR-USER: ' . $xhr_user);
      header('SES-USER: ' . $session_user);
      echo 'FAIL (should be transparent)';
    }
  } else {
    header('XHR-USER: ' . $xhr_user);
    header('SES-USER: ' . $session_user);
    if(!file_exists($file)) {
      header("X-challenge: DID-NOT");
    }else{
      unlink($file);
    }
    echo $session_user . "\n" . $session_pass;
  }
?>
