<?php

$origin = isset($_GET['origin']) ? $_GET['origin'] : $_SERVER['HTTP_ORIGIN'];

if ($origin != 'none')
    header("Access-Control-Allow-Origin: $origin");
if (isset($_GET['origin2']))
    header("Access-Control-Allow-Origin: {$_GET['origin2']}", false);

/* Preflight */
if (isset($_GET['headers']))
    header("Access-Control-Allow-Headers: {$_GET['headers']}");
if (isset($_GET['credentials']))
    header("Access-Control-Allow-Credentials: {$_GET['credentials']}");
if (isset($_GET['methods']))
    header("Access-Control-Allow-Methods: {$_GET['methods']}");

$code = isset($_GET['code']) ? intval($_GET['code']) : null;
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS' and isset($_GET['preflight']))
    $code = intval($_GET['preflight']);

if (isset($_GET['location']))
{
    if ($code === null)
    	$code = 302;

    if ($code < 400 and $code > 299)
    {
        header("Location: {$_GET['location']}", true, $code);
        die("Redirecting");
    }
}

foreach ($_SERVER as $name => $value)
{
    if (substr($name, 0, 5) == 'HTTP_')
    {
        $name = strtolower(str_replace('_', '-', substr($name, 5)));
        $headers[$name] = $value;
    } else if ($name == "CONTENT_TYPE") {
        $headers["content-type"] = $value;
    } else if ($name == "CONTENT_LENGTH") {
        $headers["content-length"] = $value;
    }
}

$headers['get_value'] = isset($_GET['get_value']) ? $_GET['get_value'] : '';

if ($code)
    header("HTTP/1.1 {$code} StatusText");

echo json_encode( $headers );
