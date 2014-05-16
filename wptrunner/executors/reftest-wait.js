var root = document.documentElement;
var observer = new MutationObserver(test);

function test(x) {
    log("classList: " + root.classList);
    if (!root.classList.contains("reftest-wait")) {
        observer.disconnect();
        marionetteScriptFinished();
    }
}

observer.observe(root, {attributes: true});
test();
