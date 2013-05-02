<?php
header('Set-Cookie: '.urldecode($_SERVER['QUERY_STRING']));
?>