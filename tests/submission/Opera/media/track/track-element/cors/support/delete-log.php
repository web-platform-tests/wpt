<?php

if ($_SERVER['REQUEST_METHOD'] !== 'GET')
    die('Method was not GET');

if (!(isset($_GET['id'])))
    die('No id');

$id = $_GET['id'];

if (strpos('/', $id) !== FALSE || strpos('/', urldecode($id)) !== FALSE)
    die('slash in id');

if ($id === 'all-logs') {
    $handler = opendir('logs/');
    while ($file = readdir($handler)) {
        if (substr($file, 0, 1) != '.') {
            unlink('logs/'.$file);
        }
    }
    closedir($handler);
} else if (file_exists("logs/$id")) {
    unlink("logs/$id");
} else {
    die('No such file');
}
echo 'OK';
?>