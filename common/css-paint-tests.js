function importPaintWorkletAndTerminateTestAfterAsyncPaint(code) {
    var blob = new Blob([code], {type: 'text/javascript'});
    paintWorklet.addModule(URL.createObjectURL(blob)).then(function() {
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                takeScreenshot();
            });
        });
    });
}

