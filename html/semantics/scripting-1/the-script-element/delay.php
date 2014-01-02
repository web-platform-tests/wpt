<?php

header("Content-Type: application/x-javascript");

switch ($_GET["sec"])
 {
 case 1:
   sleep(1);
   break;
 case 2:
   sleep(2);
   break;
 case 3:
   sleep(3);
   break;
 default:
   sleep(0);
 }

switch ($_GET["id"])
 {
 case 1:
   echo "log('1');";
   break;
 case 2:
   echo "log('2');";
   break;
 case 3:
   echo "log('3');";
   break;
 default:
   echo "";
 }
?>