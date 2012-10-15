<?php

if ($_SERVER['REQUEST_METHOD'] !== 'GET')
    die('Method was not GET');

if (!(isset($_GET['id'])))
    die('No id');

if (isset($_GET['origin'])) {
    header('Access-Control-Allow-Origin: ' . $_GET['origin']);
    header('Access-Control-Allow-Credentials: true');
}
$id = $_GET['id'];

if (strpos('/', $id) !== FALSE || strpos('/', urldecode($id)) !== FALSE)
    die('slash in id');

$cors = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'no';

$cookie = strpos($_SERVER['HTTP_COOKIE'], $id.'=yes') !== FALSE ? 'yes' : 'no';

$line = 'cors = ' . $cors . ' | cookie = ' . $cookie;

if (file_exists("logs/$id")) {
    $line = file_get_contents("logs/$id") . "\n" . $line;
}
$f = fopen("logs/$id", 'w');
fwrite($f, $line);
fclose($f);

if (isset($_GET['redirect'])) {
    header('Location: ' . $_GET['redirect']);
} else {
    echo <<<END
WEBVTT

00:00:00.000 --> 00:00:10.000
Test
END;
}

?>