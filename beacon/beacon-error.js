"use strict";

if (!this.document) {
    importScripts("/resources/testharness.js");
    importScripts("/common/utils.js");
    importScripts("beacon-common.js?pipe=sub");
}

test(function() {
    // Payload that should cause sendBeacon to return false because it exceeds the maximum payload size.
    var exceedPayload = Array(maxPayloadSize + 1).fill('z').join("");

    var success = navigator.sendBeacon("http://doesnotmatter", exceedPayload);
    assert_false(success, "calling 'navigator.sendBeacon()' with payload size exceeding the maximum size must fail");
}, "Verify calling 'navigator.sendBeacon()' with a large payload returns 'false'.");

test(function() {
    var invalidUrl = "http://invalid:url";
    // http://osgvsowi/7877590 - Fetch consistently throws TypeMismatchError instead of TypeError
    assert_throws("TypeMismatchError", function() { navigator.sendBeacon(invalidUrl, smallPayload); },
        `calling 'navigator.sendBeacon()' with an invalid URL '${invalidUrl}' must throw a TypeMismatchError`);
}, "Verify calling 'navigator.sendBeacon()' with an invalid URL throws an exception.");

test(function() {
    var invalidUrl = "nothttp://invalid.url";
    assert_throws("SyntaxError", function() { navigator.sendBeacon(invalidUrl, smallPayload); },
         `calling 'navigator.sendBeacon()' with a non-http(s) URL '${invalidUrl}' must throw a SyntaxError`);
}, "Verify calling 'navigator.sendBeacon()' with a URL that is not a http(s) scheme throws an exception.");

done();
