<?php
 // The infinite redirect script.
 $location = "http://".$_SERVER['HTTP_HOST'].$_SERVER ['SCRIPT_NAME']; //"/support/infinite-redirect";
 $page = "alternate";
 $type = 302;
 $mix = 0;
 if(isset($_GET["page"]) && $_GET["page"] == "alternate") {
   $page = "default";
 }
 if(isset($_GET["type"]) && (int) $_GET["type"] == 301) {
   $type = 301;
 }
 if(isset($_GET["mix"]) && (int) $_GET["mix"] == 1) {
   $mix = 1;
   $type = $type == 301 ? 302 : 301;
 }
 $newLocation = $location . "?page=" . $page . "&type=" . $type . "&mix=" . $mix;
 header("Cache-Control: no-cache");
 header("Pragma: no-cache");
 header("Location: " . $newLocation, true, 301);

 echo "Hello guest. You have been redirected to ".$newLocation;
?>
