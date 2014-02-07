<?php
$type = $_GET["type"];
$subtype = $_GET["subtype"];
if(!empty($type) && !empty($subtype)) {
  header("Content-Type: " . $type . "/" . $subtype);
}

$removeContentType = $_GET['removeContentType'];
if(!empty($removeContentType)) {
  header_remove("Content-Type");
}

$mimeHead = $_GET["mime"];
if(!empty($mimeHead)) {
  echo "<meta http-equiv=\"Content-Type\" content=\"" . $mimeHead . "; charset=utf-8\"/>";
}