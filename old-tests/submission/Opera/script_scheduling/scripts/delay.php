<?php

/*
* sleep a given amount of time before redirecting to specified resource
* arguments: time, url
*/

if( isset( $_GET['time'] ) ){

	sleep( $_GET['time'] );

}

if( isset( $_GET['url'] ) ){

	header( 'Location: '. $_GET['url'] );

}


?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN">
<html><head>
	<title> delayed page with redirect </title>
</head>
<body>

	<p>Sleep a given amount of time before redirecting to specified resource. Accepted query string arguments: time, url</p>

</body></html>
