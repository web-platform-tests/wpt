<?php
  $filter_value = isset($_GET["filter_value"]) && $_GET["filter_value"] ? $_GET["filter_value"] : "";
  $filter_name = isset($_GET["filter_name"]) && $_GET["filter_name"] ? strtolower($_GET["filter_name"]) : "";
  $result = "";
  foreach (getallheaders() as $name => $value) {
    if($filter_value != "") {
      if($value == $filter_value)
        $result .= strtolower($name) . ",";
    }else if (strtolower($name) == $filter_name) {
       $result .= strtolower($name) . ": ".$value."\n";
    }
  }
  header("content-type:text/plain");
  echo $result;
  exit;
?>
