function delayByFrames(f, num_frames) {
  function recurse(depth) {
    if (depth == 0)
      f();
    else
      requestAnimationFrame(() => recurse(depth-1));
  }
  recurse(num_frames);
}

// Returns a Promise which is resolved with the event object when the event is
// fired.
function getEvent(eventType) {
  return new Promise(resolve => {
    document.body.addEventListener(eventType, e => resolve(e), {once: true});
  });
}

/**
 *
 * @param {Window} context
 * @returns {Promise<Boolean>} resolved with a true if transient activation is consumed.
 */
async function consumeTransientActivation(context = window) {
  if (!context.navigator.userActivation.isActive) {
    throw new Error(
      "User activation is not active so can't be consumed. Something is probably wrong with the test."
    );
  }
  if (test_driver?.consume_user_activation) {
    return test_driver.consume_user_activation(context);
  }
  // fallback to Fullscreen API.
  if (!context.document.fullscreenElement) {
    await context.document.documentElement.requestFullscreen();
  }
  await context.document.exitFullscreen();
  return !context.navigator.userActivation.isActive;
}

function receiveMessage(type) {
  return new Promise((resolve) => {
    window.addEventListener("message", function listener(event) {
      if (typeof event.data !== "string") {
        return;
      }
      const data = JSON.parse(event.data);
      if (data.type === type) {
        window.removeEventListener("message", listener);
        resolve(data);
      }
    });
  });
}
