var callback = arguments[arguments.length - 1];

function root_wait() {
  console.log('root.classList.contains("reftest-wait"): ' + root.classList.contains("reftest-wait"));
  if (!root.classList.contains("reftest-wait")) {
    observer.disconnect();

    console.log('disconnected observer');

    console.log('Document.prototype.hasOwnProperty("fonts"): ' + Document.prototype.hasOwnProperty("fonts"));
    if (Document.prototype.hasOwnProperty("fonts")) {
      console.log('waiting on document.fonts.ready');
      document.fonts.ready.then(() => {
        console.log('document.fonts.ready fired, calling ready_for_screenshot');
        ready_for_screenshot();
      });
    } else {
      // This might take the screenshot too early, depending on whether the
      // load event is blocked on fonts being loaded. See:
      // https://github.com/w3c/csswg-drafts/issues/1088
      console.log('calling ready_for_screenshot');
      ready_for_screenshot();
    }
  }
}

function ready_for_screenshot() {
  console.log('in ready_for_screenshot()');
  // As of 2017-04-05, the Chromium web browser exhibits a rendering bug
  // (https://bugs.chromium.org/p/chromium/issues/detail?id=708757) that
  // produces instability during screen capture. The following use of
  // `requestAnimationFrame` is intended as a short-term workaround, though
  // it is not guaranteed to resolve the issue.
  //
  // For further detail, see:
  // https://github.com/jugglinmike/chrome-screenshot-race/issues/1

  requestAnimationFrame(function() {
    console.log('rAF 1 complete');
    requestAnimationFrame(function() {
      console.log('rAF 2 complete, calling callback()');
      callback();
    });
  });
}

var root = document.documentElement;
var observer = new MutationObserver(root_wait);

console.log('observer.observe(document.documentElement, {attributes: true});');
observer.observe(root, {attributes: true});

console.log('document.readyState: ' + document.readyState);
if (document.readyState != "complete") {
    console.log('addEventListener(\'load\', root_wait);');
    addEventListener('load', () => { console.log('load event listener fired'); root_wait(); });
} else {
    console.log('call root_wait()');
    root_wait();
}
