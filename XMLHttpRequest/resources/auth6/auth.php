<?php
if ($_SERVER['PHP_AUTH_USER'] == 'usr' && $_SERVER['PHP_AUTH_PW'] == 'secret') {
	header('Content-type: text/plain');
}else{
	header('Status: 401 Authorization required');
	header('HTTP/1.1 401 Unauthorized');
    header('WWW-Authenticate: Basic realm="test"');
    echo('User name/password wrong or not given: ');
}

echo  $_SERVER['PHP_AUTH_USER'] . "\n" . $_SERVER['PHP_AUTH_PW'];

?>