<?php
  $session_user = isset($_SERVER["PHP_AUTH_USER"]) ? $_SERVER["PHP_AUTH_USER"] : null;
  $session_pass = isset($_SERVER["PHP_AUTH_PW"]) ? $_SERVER["PHP_AUTH_PW"] : null;
  $xhr_user = isset($_SERVER["HTTP_X_USER"]) ? $_SERVER["HTTP_X_USER"] : null;
  $xhr_pass = isset($_SERVER["HTTP_X_PASS"]) ? $_SERVER["HTTP_X_PASS"] : null;
  $file = "authentication-temp-" . $xhr_user;

  if(empty($session_user) && empty($session_pass)) {
    if(file_exists($file)) {
      unlink($file);
      echo 'FAIL (did not send authentication in response to challenge)';
      exit;
    } else {
      $handler = fopen($file, 'w');
      fclose($handler);
      header('HTTP/1.1 401 Unauthorized');
      header('WWW-Authenticate: Basic realm="test"');
      echo 'FAIL (should be transparent)';
    }
  } else { // we received user and pass arguments
    header('XHR-USER: ' . $xhr_user);
    header('SES-USER: ' . $session_user);

    if(file_exists($file)) {
      header("X-challenge: DID");
      unlink($file);
    }else{
      header("X-challenge: DID-NOT");
    }
    echo $session_user . "\n" . $session_pass;
  }
?>
