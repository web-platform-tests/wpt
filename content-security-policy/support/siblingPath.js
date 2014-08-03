 buildSiblingPath = function(hostPrefix, relativePath, newPort) {
  var port = newPort ? newPort : document.location.port;
  var host = document.location.hostname.indexOf("www") == 0 ? hostPrefix + document.location.hostname.substring(document.location.hostname.indexOf('.')) : hostPrefix + '.' + document.location.hostname;
  var path = document.location.pathname.substring(0, document.location.pathname.lastIndexOf('/') + 1);
  return (document.location.protocol + '//' + host + ':' + port + path + relativePath);
};