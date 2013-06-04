<?php
  if (isset($_GET['logout'])) {
    header('HTTP/1.1 401 Unauthorized');
    header('WWW-Authenticate: Basic realm="test"');
    die("Logged out, hopefully");
  }

  $session_user = isset($_SERVER["PHP_AUTH_USER"]) ? $_SERVER["PHP_AUTH_USER"] : null;
  $session_pass = isset($_SERVER["PHP_AUTH_PW"]) ? $_SERVER["PHP_AUTH_PW"] : null;
  $expected_user_name = isset($_SERVER["HTTP_X_USER"]) ? $_SERVER["HTTP_X_USER"] : null;
  $expected_user_password = isset($_SERVER["HTTP_X_PASS"]) ? $_SERVER["HTTP_X_PASS"] : null;
  $file = "authentication-temp-" . $expected_user_name;
  if((empty($session_user) && empty($session_pass))/* ||
     ($session_user != $expected_user_name || $session_pass != $expected_user_password)*/
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
      header('XHR-USER: ' . $expected_user_name);
      header('SES-USER: ' . $session_user);
      echo 'FAIL (should be transparent)';
    }
  } else {
    header('XHR-USER: ' . $expected_user_name);
    header('SES-USER: ' . $session_user);
    if(!file_exists($file)) {
      header("X-challenge: DID-NOT");
    }else{
      header("X-challenge: DID");
      unlink($file);
    }
    echo $session_user . "\n" . $session_pass;
  }
?>
