var geo;

setup(function() {
  geo = navigator.geolocation;
});

// The spec states that an implementation SHOULD acquire user permission before
// beginning the position acquisition steps. If an implementation follows this
// advice, set the following flag to aid debugging.
var isUsingPreemptivePermission = false;


var dummyFunction = function() {};

var positionToString = function(pos) {
  var c = pos.coords;
  return '[lat: ' + c.latitude + ', lon: ' + c.longitude + ', acc: ' + c.accuracy + ']';
};

var errorToString = function(err) {
  var codeString;
  switch(err.code) {
    case err.UNKNOWN_ERROR: codeString = 'UNKNOWN_ERROR'; break;
    case err.PERMISSION_DENIED: codeString = 'PERMISSION_DENIED'; break;
    case err.POSITION_UNAVAILABLE: codeString = 'POSITION_UNAVAILABLE'; break;
    case err.TIMEOUT: codeString = 'TIMEOUT'; break;
    default: codeString = 'undefined error code'; break;
  }
  return '[code: ' + codeString + ' (' + err.code + '), message: ' + (err.message ? err.message : '(empty)') + ']';
};

/**
 * Returns the current geolocation or throws error.
 *
 * @param {number} timeout - Timeout in milliseconds, default is 200ms.
 */
function getCurrentGeolocation(timeout = 200) {
  return new Promise(
      (resolve, reject) => window.navigator.geolocation.getCurrentPosition(
          position => resolve(position.coords.toJSON()),
          error => reject(error),
          // Fail fast if geolocation is not available.
          {timeout}
      ))
}
