<?php
  if(isset($_GET['cors'])){
    // mark this resource as super-CORS-friendly..
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, FOO');
    header('Access-Control-Allow-Headers: x-test, x-foo');
    header('Access-Control-Expose-Headers: x-request-method, x-request-content-type, x-request-query, x-request-content-length');
  }
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
