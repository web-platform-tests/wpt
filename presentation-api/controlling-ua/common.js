(function (window) {
  // Cast ID of the main custom receiver application linked with the test suite
  // That application ID, maintained by W3C team, points at:
  // https://[W3C test server]/presentation-api/controlling-ua/support/presentation.html
  //
  // NB: this mechanism should be improved later on as tests should not depend
  // on something that directly or indirectly maps to a resource on the W3C test
  // server.
  var castAppId = '915D2A2C';

  // NB: the Cast-friendly URL will likely need to be adjusted afterwards as
  // well, e.g. to use another scheme.
  var castClientId = String(new Date().getTime()) +
    String(Math.floor(Math.random() * 1e5));
  var castUrl = 'support/presentation.html#' +
    '__castAppId__=' + castAppId +
    '/__castClientId__=' + castClientId;

  window.presentationUrls = [
    'support/presentation.html',
    castUrl
  ];
})(window);