"use strict";

importScripts("beacon-common.js?pipe=sub");

// An array should be passed through postMessage to this web worker, where
//     [0] contains a test case id as defined in beacon-common.js.
//     [1] is the URL for the sendBeacon().
//     [2] a boolean indicating whether to terminate this web worker right after calling sendBeacon.
// The return value of sendBeacon is returned back to the window through postMesage.
onmessage = function(e) {
    var testCaseId = e.data[0];
    var url = e.data[1];
    var closeAfterSending = e.data[2];

    // Reconstruct enough of the test case to send the beacon
    // (data and url).
    var testCase = testLookup[testCaseId];
    testCase.url = url;

    // Send the Beacon.
    var sendResult = sendData(testCase);

    // Let the main page continue the test.
    postMessage(sendResult);

    if (closeAfterSending) {
        close();
    }
}
