if (this.document === undefined)
  importScripts("xmlhttprequest-timeout.js");

runTestRequests([ [true, "load fires normally with no timeout set, twice", 0, TIME_REGULAR_TIMEOUT, 0],
                  [true, "load fires normally with same timeout set twice", TIME_NORMAL_LOAD, TIME_REGULAR_TIMEOUT, TIME_NORMAL_LOAD],
                  [true, "timeout fires normally with same timeout set twice", TIME_REGULAR_TIMEOUT, TIME_DELAY, TIME_REGULAR_TIMEOUT] ]);
