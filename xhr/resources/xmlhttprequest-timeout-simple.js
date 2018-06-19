if (this.document === undefined)
  importScripts("xmlhttprequest-timeout.js");

runTestRequests([ [true, "no time out scheduled, load fires normally", 0],
                  [true, "load fires normally", TIME_NORMAL_LOAD],
                  [true, "timeout hit before load", TIME_REGULAR_TIMEOUT] ]);
