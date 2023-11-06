function checkSnapchangedSupport() {
  assert_true(window.onsnapchanged !== undefined, "snapchanged not supported");
}

function assertSnapchangedEvent(evt, expected_ids) {
  if (evt == null) {
    assert_true(false, `${data}`);
  }
  assert_equals(evt.bubbles, false, "snapchanged event doesn't bubble");
  assert_false(evt.cancelable, "snapchanged event is not cancelable.");
  const actual = Array.from(evt.snapTargets, el => el.id).join(",");
  const expected = expected_ids.join(",");
  assert_equals(actual, expected, "snapped to expected targets");
}

let data;
async function test_snapchanged(test, test_data) {
  checkSnapchangedSupport();
  await waitForScrollReset(test, test_data.scroller);
  await waitForCompositorCommit();
  data = `data:scrolltop=${scroller.scrollTop},scrollLeft=${scroller.scrollLeft},`;

  let listener = test_data.scroller ==
      document.scrollingElement ? document : test_data.scroller;

  const scrollbar_width = scroller.offsetWidth - scroller.clientWidth;
  const bounds = scroller.getBoundingClientRect();
  const x = bounds.right - Math.round(scrollbar_width / 2);
  const y = bounds.bottom - Math.round(bounds.height / 2) - 20;
  data = data.concat(`scrollbar_width=${scrollbar_width},bounds.right=${bounds.right},bounds.bottom=${bounds.bottom},x=${x},y=${y}`);
  let log_scroll = (evt) => {
    data = data.concat(`,scroll@[${scroller.scrollTop}]`);
  };
  let log_scrollend = (evt) => {
    data = data.concat(`,scrollend@[${scroller.scrollTop}]`);
  };
  scroller.addEventListener("scroll", log_scroll);
  scroller.addEventListener("scrollend", log_scrollend);

  const snapchanged_promise = waitForSnapChangedEvent(listener);
  await test_data.scrolling_function();
  console.log("before snapchanged wait");
  let evt = await snapchanged_promise;
  console.log("after snapchanged wait");

  scroller.removeEventListener("scroll", log_scroll);
  scroller.removeEventListener("scrollend", log_scrollend);

  assertSnapchangedEvent(evt,
      test_data.expected_snap_targets);
  assert_approx_equals(test_data.scroller.scrollTop,
    test_data.expected_scroll_offsets.y, 1,
    "vertical scroll offset mismatch.");
  assert_approx_equals(test_data.scroller.scrollLeft,
    test_data.expected_scroll_offsets.x, 1,
    "horizontal scroll offset mismatch.");
}

function waitForEventUntil(event_target, event_type, wait_until) {
  return new Promise(resolve => {
    let result = null;
    const listener = (evt) => {
      result = evt;
    };
    event_target.addEventListener(event_type, listener);
    wait_until.then(() => {
      event_target.removeEventListener(event_type, listener);
      resolve(result);
    });
  });
}

// Proxy a wait for a snapchanged event. We want to avoid having a test
// timeout in the event of an expected snapchanged not firing in a particular
// test case as that would cause the entire file to fail.
// Snapchanged should fire before scrollend, so if a scroll should happen, wait
// for a scrollend event. Otherwise, just do a rAF-based wait.
function waitForSnapChangedEvent(event_target, scroll_happens = true) {
  return scroll_happens ? waitForEventUntil(event_target, "snapchanged",
                                   waitForScrollendEventNoTimeout(event_target))
                        : waitForEventUntil(event_target, "snapchanged",
                                   waitForAnimationFrames(2));
}

function getScrollbarToScrollerRatio(scroller) {
  // Ideally we'd subtract the length of the scrollbar thumb from
  // the dividend but there isn't currently a way to get the
  // scrollbar thumb length.
  return scroller.clientHeight /
      (scroller.scrollHeight - scroller.clientHeight);
}
