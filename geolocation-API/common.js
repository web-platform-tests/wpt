var geo = window.navigator.geolocation;
var testFinished = false;
var messageEl = $('message');
var instructionsEl = $('instructions');

// inject this test's javascript code
if (window.location.search.length > 1) {
  var testNumber = window.location.search.substring(1);
  document.getElementsByTagName('title')[0].text='Test '+testNumber;
  document.getElementById('source').href='t'+testNumber+'.js';
  var testScript = document.createElement('script');
  testScript.type = 'text/javascript';
  testScript.src = 't' + testNumber + '.js';
  message('');
  document.getElementsByTagName('body')[0].appendChild(testScript);
}


if (geo == undefined) fail('Geolocation API not supported by this browser');

// The spec states that an implementation SHOULD acquire user permission before
// beggining the position acquisition steps. If an implementation follows this
// advice, set the following flag to aid debugging.
var isUsingPreemptivePermission = false;

//===================================================



function $(id) {
  return document.getElementById(id);
}

function pass(message) {
  if (!testFinished) {
    messageEl.className = 'pass';
    messageEl.innerHTML = 'PASS' + (message ? ': ' + message : '');
    testFinished = true;
  }
}

function fail(message) {
  if (!testFinished) {
    messageEl.className = 'fail';
    messageEl.innerHTML = 'FAIL' + (message ? ': ' + message : '');
    testFinished = true;
  }
}

function maybe(message) {
  messageEl.className = 'maybe';
  messageEl.innerHTML = message ? message : '';
}

function message(message) {
  if (!testFinished) {
    messageEl.className = '';
    messageEl.innerHTML = message ? message : '';
  }
}

function instruction(message) {
  if (!testFinished) {
    instructionsEl.innerHTML = message ? message : '';
  }
}
function askAccept() {
  instruction('Clear all Geolocation permissions before running this test. If prompted for permission, please allow.');
}
function askRefuse() {
  instruction('Clear all Geolocation permissions before running this test. If prompted for permission, please deny.');
}

function run(fn) {
  try {
    fn();
  } catch(e) { fail('Test threw unexpected exception "' + e + '".'); };
}

function runExpectingException(type, fn) {
  try {
    fn();
    fail('Test did not throw expected exception "' + type + '"');
  } catch(e) {
    maybe('Test threw exception below. PASS if type is "' + type + '", otherwise FAIL.<br><br>' + e);
  }
}

var dummyFunction = function() {};

var expectedErrorCallback = function(e) {
  pass('An error callback was invoked with error ' + errorToString(e));
};
var expectedSuccessCallback = function(pos) {
  pass('A success callback was invoked with position ' + positionToString(pos));
};

var unexpectedErrorCallback = function(e) {
  fail('An error callback was invoked unexpectedly with error ' + errorToString(e));
};
var unexpectedSuccessCallback = function(pos) {
  fail('A success callback was invoked unexpectedly with position ' + positionToString(pos));
};

var positionToString = function(pos) {
  var c = pos.coords;
  return '[lat: ' + c.latitude + ', lon: ' + c.longitude + ', acc: ' + c.accuracy + ']';
}

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
}
