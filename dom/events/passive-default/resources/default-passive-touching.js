function waitFor(condition) {
  const MAX_FRAME = 500;
  return new Promise((resolve, reject) => {
    function tick(frames) {
      // We requestAnimationFrame either for 500 frames or until condition is
      // met.
      if (frames >= MAX_FRAME)
        reject("Condition did not become true after 500 frames");
      else if (condition())
        resolve();
      else
        requestAnimationFrame(tick.bind(this, frames + 1));
    }
    tick(0);
  });
}

function waitForCompositorCommit() {
  return new Promise((resolve) => {
    // rAF twice.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

function injectInput(touchDiv, moveCount) {
  const actions = new test_driver.Actions()
    .addPointer("touch_pointer", "touch")
    .pointerMove(0, 0, {origin: touchDiv})
    .pointerDown();
  for (let i = 0; i < moveCount; ++i) {
    const offset = (i + 1) * 30;
    actions.pointerMove(offset, offset);
  }
  actions.pointerUp()
    .send();
}

function runTest({target, eventName, expectCancelable, preventDefault}) {
  let touchDiv = document.getElementById("touchDiv");
  let cancelable = [];
  let arrived = 0;
  target.addEventListener(eventName, function (event) {
    cancelable.push(event.cancelable);
    arrived++;
    if (preventDefault) {
      event.preventDefault();
    }
  });
  promise_test (async () => {
    await waitForCompositorCommit();
    injectInput(touchDiv, expectCancelable.length);
    await waitFor(()=> { return arrived >= expectCancelable.length; });
    assert_array_equals(cancelable, expectCancelable);
  });
}
