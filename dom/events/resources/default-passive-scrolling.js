function waitFor(condition) {
  const MAX_FRAME = 200;
  return new Promise((resolve, reject) => {
    function tick(frames) {
      // We requestAnimationFrame either for 200 frames or until condition is
      // met.
      if (frames >= MAX_FRAME)
        reject("Condition did not become true after 200 frames");
      else if (condition())
        resolve();
      else
        requestAnimationFrame(tick.bind(this, frames + 1));
    }
    tick(0);
  });
}

function runTest({target, eventName, expectCancelable}) {
  let cancelable = null;
  let arrived = false;
  target.addEventListener(eventName, function (event) {
      cancelable = event.cancelable;
      arrived = true;
      event.preventDefault();
  });

  promise_test (async (t) => {
    t.add_cleanup(() => {
      document.querySelector('div[style="height: 200vh"]').remove();
    })
    const pos_x = Math.floor(window.innerWidth / 2);
    const pos_y = Math.floor(window.innerHeight / 2);
    const delta_x = 0;
    const delta_y = 100;
    await new test_driver.Actions()
       .scroll(pos_x, pos_y, delta_x, delta_y).send();
    await waitFor(()=> { return arrived; });
    assert_equals(cancelable, expectCancelable);
  }, `${eventName} events are ${ expectCancelable ? '' : 'non-' }cancelable since the event listener on ${target.constructor.name} is treated as ${ expectCancelable ? 'not ' : '' }passive`);
}
