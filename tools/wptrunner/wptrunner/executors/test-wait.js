window.__wptrunner_url = arguments.length > 1 ? arguments[0] : location.href;
window.__wptrunner_testdriver_callback = arguments[arguments.length - 1];
if (window.__wptrunner_process_next_event) {
  window.__wptrunner_process_next_event();
}

function wait_load() {
  if (Document.prototype.hasOwnProperty("fonts")) {
    document.fonts.ready.then(wait_paints);
  } else {
    // This might take the screenshot too early, depending on whether the
    // load event is blocked on fonts being loaded. See:
    // https://github.com/w3c/csswg-drafts/issues/1088
    wait_paints();
  }
}

function wait_paints() {
  // As of 2017-04-05, the Chromium web browser exhibits a rendering bug
  // (https://bugs.chromium.org/p/chromium/issues/detail?id=708757) that
  // produces instability during screen capture. The following use of
  // `requestAnimationFrame` is intended as a short-term workaround, though
  // it is not guaranteed to resolve the issue.
  //
  // For further detail, see:
  // https://github.com/jugglinmike/chrome-screenshot-race/issues/1

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      screenshot_if_ready();
    });
  });
}

function screenshot_if_ready() {
  var root = document.documentElement;
  if (root &&
      root.classList.contains("%(classname)s") &&
      !window.__wptrunner_observer) {
    window.__wptrunner_observer = new MutationObserver(wait_paints);
    __wptrunner_observer.observe(root, {attributes: true});
    var event = new Event("TestRendered", {bubbles: true});
    root.dispatchEvent(event);
    return;
  }
  if (window.__wptrunner_observer) {
    __wptrunner_observer.disconnect();
  }
  if (window.__wptrunner_message_queue) {
    __wptrunner_message_queue.push({type: "complete"});
  } else {
    // Not using `testdriver.js`, so manually post a raw completion message
    // that the executor understands.
    __wptrunner_testdriver_callback([__wptrunner_url, "complete", []]);
  }
}


if (document.readyState != "complete") {
  if (!window.__wptrunner_wait_load) {
    window.__wptrunner_wait_load = wait_load;
    addEventListener('load', __wptrunner_wait_load);
  }
} else {
  wait_load();
}
// TODO: Should we do anything about unhandled rejections?
