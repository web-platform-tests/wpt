function runTest(modalName, expectedValue) {
    let timeOutForFailingToOpenModal = 500;
    let startTime;
    async_test(t => {
        let iframe = document.querySelector("iframe");
        iframe.onload = function() {
            window.addEventListener("message", t.step_func_done(e => {
                e.source.close();
                assert_less_than(new Date().getTime() - startTime, timeOutForFailingToOpenModal, "Call to open modal dialog did not return immediately");
                assert_equals(e.data, expectedValue, "Call to open modal dialog did not return expected value");
            }));
            startTime = new Date().getTime();
            iframe.contentWindow.postMessage(modalName, "*");
         }
        iframe.src = "support/iframe-that-opens-modals.html";
    }, "Frames without `allow-modals` should not be able to open modal dialogs");
}
