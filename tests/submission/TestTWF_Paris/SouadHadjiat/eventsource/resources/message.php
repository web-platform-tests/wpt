<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

while(1){
	echo "data:msg";
	echo "\n";
	echo "data: msg";
	echo "\n\n";
	
	echo ":";
	echo "\n";
	
	echo "falsefield:msg";
	echo "\n\n";
	
	echo "falsefield:msg";
	echo "\n";
	
	echo "Data:data";
	echo "\n\n";
	
	echo "data";
	echo "\n\n";
	
	echo "data:end";
	echo "\n\n";
	
	ob_flush();
  	flush();
	sleep(2);
}
?>

