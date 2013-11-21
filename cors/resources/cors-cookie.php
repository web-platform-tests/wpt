<?php
 $origin = isset($_GET['origin']) ? $_GET['origin'] : $_SERVER['HTTP_ORIGIN'];
 $credentials = isset($_GET['credentials']) ? $_GET['credentials'] : 'true';

 header("Content-Type: text/plain");
 if ($origin != 'none')
   header("Access-Control-Allow-Origin: {$origin}");
 if ($credentials != 'none')
   header("Access-Control-Allow-Credentials: {$credentials}");

 $ident = isset($_GET['ident']) ? $_GET['ident'] : 'test';

 if (isset($_COOKIE[$ident])) {
   /* Delete the cookie */
   header("Set-Cookie: $ident=COOKIE; expires=Fri, 27 Jul 2001 02:47:11 UTC");
   echo $_COOKIE[$ident];
 }
 else {
   header("Set-Cookie: $ident=COOKIE");
   echo 'NO_COOKIE';
 }
