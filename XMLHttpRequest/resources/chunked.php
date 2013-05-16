<?php
	$chunks = Array(
		"First chunk\r\n",
		"Second chunk\r\n",
		"Yet another (third) chunk\r\n",
		"Yet another (fourth) chunk\r\n",
	);
	header("Transfer-Encoding: chunked");
	header("Trailer: X-Test-Me");
	header("Content-Type: text/plain");
	flush();

	foreach ($chunks as $key => $value) {
		echo sprintf("%x\r\n", strlen($value));
		echo $value;
		echo "\r\n";
		//sleep(0.5);
	}
	echo "0\r\n";
	echo "X-Test-Me: Trailer header value\r\n\r\n"
?>