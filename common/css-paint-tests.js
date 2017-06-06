// We call rAF and in the second frame we compare the result with the ref.html.
function importPaintWorkletAndTerminateTestAfterAsyncPaint(code) {
    if (window.testRunner) {
        testRunner.waitUntilDone();
    }
    var blob = new Blob([code], {type: 'text/javascript'});
    var frame_cnt = 0;
    paintWorklet.addModule(URL.createObjectURL(blob)).then(function() {
        requestAnimationFrame(function() {
            takeScreenshot(frame_cnt);
        });
    });
}

function takeScreenshot(frame_cnt) {
    frame_cnt = frame_cnt + 1;
    if (frame_cnt == 2) {
        testRunner.notifyDone();
    }
    requestAnimationFrame(function() {
        takeScreenshot(frame_cnt);
    });
}
