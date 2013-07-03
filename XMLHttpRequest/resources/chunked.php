<?php
	// This code to turn gzip off is at attempt to get the test to run better on w3c-test.org
    if(ini_get('zlib.output_compression')){ 
        ini_set('zlib.output_compression', 'Off'); 
    }
    @apache_setenv('no-gzip', 1);
    // Done (hopefully) disabling gzip
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