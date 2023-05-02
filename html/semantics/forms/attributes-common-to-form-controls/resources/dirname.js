function __onIframeLoaded(t, cb, selector, done) {
  const iframe = document.querySelector(selector);
  iframe.addEventListener("load", function() {
    // The initial about:blank load event can be fired before the form navigation occurs.
    // See https://github.com/whatwg/html/issues/490 for more information.
    if(iframe.contentWindow.location.href == "about:blank") { return; }

    const params = new URLSearchParams(iframe.contentWindow.location.search);
    t.step(() => cb(params))
    if (done) t.done();
  });
}

function onIframeLoaded(t, cb, selector="iframe") {
  return __onIframeLoaded(t, cb, selector, false);
}

function onIframeLoadedDone(t, cb, selector="iframe") {
  return __onIframeLoaded(t, cb, selector, true);
}
