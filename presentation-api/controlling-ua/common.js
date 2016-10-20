(function (window) {
  // Cast ID of the main custom receiver application linked with the test suite
  // That application ID, maintained by W3C team, points at:
  // https://w3c-test.org/presentation-api/controlling-ua/support/presentation.html
  var castAppId = '915D2A2C';

  // NB: the Cast-friendly URL will likely need to be adjusted afterwards as
  // well, e.g. to use another scheme.
  var castClientId = String(new Date().getTime()) +
    String(Math.floor(Math.random() * 1e5));
  var castUrl = 'http://google.com/cast/#' +
    '__castAppId__=' + castAppId +
    '/__castClientId__=' + castClientId;

  window.presentationUrls = [
    'support/presentation.html',
    castUrl
  ];
})(window);