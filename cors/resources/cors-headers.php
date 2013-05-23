<?php
 header("Access-Control-Allow-Origin: *");
 header("Access-Control-Expose-Headers: X-Custom-Header, X-Custom-Header-Empty, X-Custom-Header-Comma, X-Custom-Header-Bytes");
 header("Access-Control-Expose-Headers: X-Second-Expose", false);
 header("Access-Control-Expose-Headers: Date", false);

 header("Content-Type: text/plain");

 header("X-Custom-Header: test");
 header("X-Custom-Header: test");
 header("Set-Cookie: test1=t1;max-age=2");
 header("Set-Cookie2: test2=t2;Max-Age=2");
 header("X-Custom-Header-Empty:");
 header("X-Custom-Header-Comma: 1");
 header("X-Custom-Header-Comma: 2", false);
 header("X-Custom-Header-Bytes: …");
 header("X-Nonexposed: unicorn");
 header("X-Second-Expose: flyingpig");

 /* Simple response headers */
 header("Cache-Control: no-cache");
 header("Content-Language: nn");
 header("Expires: Thu, 01 Dec 1994 16:00:00 GMT");
 header("Last-Modified: Thu, 01 Dec 1994 10:00:00 GMT");
 header("Pragma: no-cache");

 echo "TEST";
?>
