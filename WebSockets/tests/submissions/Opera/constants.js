//FIXME: 
var DOMAIN_FOR_WS_TESTS = location.hostname;
var DOMAIN_FOR_WSS_TESTS = location.hostname;

// logic for using wss URLs instead of ws
var SCHEME_AND_DOMAIN;
if (location.search == '?wss') {
  SCHEME_AND_DOMAIN = 'wss://'+DOMAIN_FOR_WSS_TESTS;
} else {
  SCHEME_AND_DOMAIN = 'ws://'+DOMAIN_FOR_WS_TESTS;
}