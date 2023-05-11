test(function() {assert_throws_dom("SyntaxError", function(){new WebSocket("ws://foo bar.com/")})});
test(function() {assert_throws_dom("SyntaxError", function(){new WebSocket("wss://foo bar.com/")})});
test(function() {assert_throws_dom("SyntaxError", function(){new WebSocket("ftp://"+location.host+"/")})});
test(function() {assert_throws_dom("SyntaxError", function(){new WebSocket("mailto:example@example.org")})});
test(function() {assert_throws_dom("SyntaxError", function(){new WebSocket("about:blank")})});
test(function() {assert_throws_dom("SyntaxError", function(){new WebSocket(SCHEME_DOMAIN_PORT+"/#")})});
test(function() {assert_throws_dom("SyntaxError", function(){new WebSocket(SCHEME_DOMAIN_PORT+"/#test")})});
test(function() {assert_throws_dom("SyntaxError", function(){new WebSocket("#test")})});
