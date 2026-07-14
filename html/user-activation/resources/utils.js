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


// Returns a Promise resolved with true iff transient activation was present and consumed.
async function consumeTransientActivation() {
  return await test_driver.consume_user_activation();
}

// Returns a `Promise` that gets resolved when `window` receives a "message"
// event with an `event.data` JSON string whose "type" field matches the given
// parameter.  The promise is resolved with JSON-parsed `event.data`.
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
