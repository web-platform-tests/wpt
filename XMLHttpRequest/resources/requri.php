<?php
if (isset($_GET['full'])) {
	echo "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
}else{
	echo $_SERVER['REQUEST_URI'];
}
?>