<?php 
 //Check if Sec header is set
  if($_SERVER['Sec-WebSocket-Key'])
    echo"FAIL";
  else
    echo"PASS";
 ?>