"use strict";

if (!this.document) {
    importScripts("/resources/testharness.js");
    importScripts("/common/utils.js");
    importScripts("beacon-common.js?pipe=sub");
}

// Execute each sample test per redirect status code.
// Note that status codes 307 and 308 are the only codes that will maintain POST data
// through a redirect.
[307, 308].forEach(function(status) {
    // Implement the self.buildId extension to identify the parameterized
    // test in the report.
    self.buildId = function(baseId) {
        return `${baseId}-${status}`;
    };

    // Implement the self.buildTargetUrl extension to inject a redirect to
    // the sendBeacon target.
    self.buildTargetUrl = function(targetUrl) {
        return `/common/redirect.py?status=${status}&location=${encodeURIComponent(targetUrl)}`;
    };

    runTests(sampleTests);
});

done();