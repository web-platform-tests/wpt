<?php
 // The infinite redirect script.
 
 $location = "http://tc.labs.opera.com/support/infinite-redirect";
 $page = "alternate";
 $type = 302;
 $mix = 0;
 if($_GET["page"] && $_GET["page"] == "alternate") {
   $page = "default";
 }
 if($_GET["type"] && (int) $_GET["type"] == 301) {
   $type = 301;
 }
 if($_GET["mix"] && (int) $_GET["mix"] == 1) {
   $mix = 1;
   $type = $type == 301 ? 302 : 301;
 }
 $newLocation = $location . "?page=" . $page . "&type=" . $type . "&mix=" . $mix;
 header("Cache-Control: no-cache");
 header("Pragma: no-cache");
 header("Location: " . $newLocation, true, 301);
?>
