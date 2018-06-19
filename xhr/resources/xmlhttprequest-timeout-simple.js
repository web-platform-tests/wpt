if (this.document === undefined)
  importScripts("xmlhttprequest-timeout.js");

var tests = [
  [true, "no time out scheduled, load fires normally", 0],
  [true, "load fires normally", TIME_NORMAL_LOAD],
  [true, "timeout hit before load", TIME_REGULAR_TIMEOUT],
];

if (location.search) {
  tests = tests.filter(test => test[1] == decodeURIComponent(location.search.substr(1)));
}

runTestRequests(tests.map(test => new RequestTracker(...test)));
