<?php
  $id = isset($_SERVER['HTTP_LAST_EVENT_ID'])
  	? $_SERVER['HTTP_LAST_EVENT_ID']
	: '';

  $ident = isset($_GET['ident'])
  	? $_GET['ident']
	: 'test';

  $cookie = isset($_COOKIE[$ident])
  	? "COOKIE"
	: "NO_COOKIE";

  $origin = isset($_GET['origin'])
  	? $_GET['origin']
	: $_SERVER['HTTP_ORIGIN'];

  $credentials = isset($_GET['credentials'])
  	? $_GET['credentials']
	: 'true';

  if ($origin != 'none')
    header("Access-Control-Allow-Origin: {$origin}");

  if ($credentials != 'none')
    header("Access-Control-Allow-Credentials: {$credentials}");


  if ($id == '') {
    header("Content-Type: text/event-stream");
    header("Set-Cookie: $ident=COOKIE");

    echo "id: 1\n";
    echo "retry: 200\n";
    echo "data: first $cookie\n\n";
  }
  else if ($id == '1') {
    header("Content-Type: text/event-stream");
    header("Set-Cookie: $ident=COOKIE; expires=Fri, 27 Jul 2001 02:47:11 UTC");

    echo "id: 2\n";
    echo "data: second $cookie\n\n";
  }
  else {
    header("Content-Type: stop");
    echo "data: $id $cookie\n\n";
  }
