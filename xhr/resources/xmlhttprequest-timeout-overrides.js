if (this.document === undefined)
  importScripts("xmlhttprequest-timeout.js");
/*
Sets up three requests to a resource that will take 0.6 seconds to load:
1) timeout first set to TIME_NORMAL_LOAD, after TIME_REGULAR_TIMEOUT timeout is set to 0, asserts load fires
2) timeout first set to TIME_NORMAL_LOAD, after TIME_DELAY timeout is set to TIME_REGULAR_TIMEOUT, asserts load fires (race condition..?!?)
3) timeout first set to 0, after TIME_REGULAR_TIMEOUT it is set to TIME_REGULAR_TIMEOUT * 10, asserts load fires
*/
var tests = [
  [true, "timeout disabled after initially set", TIME_NORMAL_LOAD, TIME_REGULAR_TIMEOUT, 0],
  [true, "timeout overrides load after a delay", TIME_NORMAL_LOAD, TIME_DELAY, TIME_REGULAR_TIMEOUT],
  [true, "timeout enabled after initially disabled", 0, TIME_REGULAR_TIMEOUT, TIME_NORMAL_LOAD * 10],
];

if (location.search) {
  tests = tests.filter(test => test[1] == decodeURIComponent(location.search.substr(1)));
}

runTestRequests(tests.map(test => new RequestTracker(...test)));
