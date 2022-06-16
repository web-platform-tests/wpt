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

function runTest({target, eventName, expectCancelable, preventDefault}) {
  let cancelable = [];
  let arrived = 0;
  target.addEventListener(eventName, function (event) {
    cancelable.push(event.cancelable);
    arrived++;
    if (preventDefault) {
      event.preventDefault();
    }
  });

  promise_test (async (t) => {
    t.add_cleanup(() => {
      document.querySelector('.remove-on-cleanup')?.remove();
    })
    const pos_x = Math.floor(window.innerWidth / 2);
    let pos_y = Math.floor(window.innerHeight / 2);
    const delta_x = 0;
    const delta_y = 100;
    const actions = new test_driver.Actions();
    for (let i = 0; i < expectCancelable.length; ++i) {
      actions.scroll(pos_x, pos_y, delta_x, (i + 1) * delta_y)
      pos_y += delta_y;
    }
    await actions.send();
    await waitFor(()=> { return arrived >= expectCancelable.length; });
    assert_array_equals(cancelable, expectCancelable);
  });
}
