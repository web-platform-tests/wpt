"use strict";
importScripts("/resources/testharness.js");
test(function () {
  let log = [];
  for (const x in navigator) {
    // skip functions, as they are settable
    if (typeof navigator[x] === "function") continue;

    // Trying to override a property should throw in strict mode
    try {
      navigator[x] = "";
      log.push(x);
    } catch (err) {}
  }
}, "navigator properties are read-only");
done();
