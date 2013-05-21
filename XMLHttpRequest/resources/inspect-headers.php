<?php
  $filter_value = $_GET["filter_value"] ? $_GET["filter_value"] : "";
  $result = "";
  foreach (getallheaders() as $name => $value) {
    if($filter_value != "") {
      if($value == $filter_value)
        $result .= strtolower($name) . ",";
    }
  }
  header("content-type:text/plain");
  echo $result;
  exit;
?>
