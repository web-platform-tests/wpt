const MEDIA_QUERY = `(max-width: ${IFRAME_BASE_WIDTH}px)`;
const IFRAME_DEFAULT_SIZE = "200";

function createIFrame(t, width = IFRAME_DEFAULT_SIZE, height = width) {
    assert_not_equals(document.body, null, "HARNESS ERROR: <body> is missing");

    const iframe = document.createElement("iframe");
    iframe.srcdoc = "";
    iframe.width = String(width);
    iframe.height = String(height);
    iframe.style.border = "none";

    t.add_cleanup(() => {
        document.body.removeChild(iframe);
    });

    return new Promise(resolve => {
        iframe.addEventListener("load", () => {
            iframe.contentDocument.body.offsetWidth; // reflow
            resolve(iframe);
        });

        document.body.appendChild(iframe);
    });
}

function triggerMQLEvent(iframe) {
    iframe.width = iframe.width === IFRAME_BASE_WIDTH ? "250" : IFRAME_BASE_WIDTH;
}

function waitForChangesReported() {
    return new Promise(resolve => {
        step_timeout(resolve, 75);
    });
}
