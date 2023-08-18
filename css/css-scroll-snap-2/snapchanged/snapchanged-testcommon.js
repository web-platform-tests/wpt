function resetScroller(scroller) {
  return new Promise((resolve) => {
    if (scroller.scrollTop == 0 && scroller.scrollLeft == 0) {
      resolve();
    } else {
      scroller.scrollTop = 0;
      scroller.scrollLeft = 0;
      requestAnimationFrame(async () => {
        resetScroller(scroller).then(resolve);
      });
    }
  });
}

function createScrollendPromise(scroller) {
  return new Promise((resolve) => {
    if (scroller == document.scrollingElement) {
      document.addEventListener("scrollend", resolve);
    } else {
      scroller.addEventListener("scrollend", resolve);
    }
  });
}

function assertSnapEvent(evt, expected_snap_target_ids) {
  assert_true(evt.bubbles, "snapchanged event bubbles");
  assert_false(evt.cancelable, "snapchanged event is not cancelable.");
  assert_equals(evt.snappedList.x.length, expected_snap_target_ids.x.length,
                "snapchanged event has correct x target");
  assert_equals(evt.snappedList.y.length, expected_snap_target_ids.y.length,
                "snapchanged event has correct y target");
  for (const id of expected_snap_target_ids.x) {
    assert_true(evt.snappedList.x.includes(id));
  }
  for (const id of expected_snap_target_ids.y) {
    assert_equals(evt.snappedList.y.includes(id));
  }
  assert_equals(evt.snappedTargetsList.length,
                document.getElementsByClassName("snap_point").length);
  for (const element of document.getElementsByClassName("snap_point")) {
    assert_true(evt.snappedTargetsList.includes(element));
  }
  assert_true(evt.invokedProgrammatically,
              "snapchanged event was programmatically triggered ");
}

function getCurrentOffset(scroller) {
  return {
    x: scroller.scrollLeft,
    y: scroller.scrollTop
  };
}

async function test_snapchanged(test, scroller, scrolling_function) {
  // This test could simply scroll once, snap once and verify that
  // snapchanged fired once but if snapchanged is not supported, waiting for
  // the snapchanged event leads to a timeout.
  // To avoid having this test timeout when snapchanged is not supported,
  // we scroll twice, first to snap_point_1 and then snap_point_2.
  // This way, we can expect that a snapchanged event should have occurred
  // between the first scrollend and the second scrollend.
  // TODO: make this test simpler when snapchanged is implemented and won't
  // timeout.
  await resetScroller(scroller);
  assert_equals(scroller.scrollTop, 0, "scroller is initially not scrolled");
  assert_equals(scroller.scrollLeft, 0, "scroller is initially not scrolled");
  let snapchanged_fired = false;

  let expected_snap_target_ids = {
    x: [ snap_point_2.id ],
    y: [ snap_point_2.id ]
  };
  function snapChangedHandler(evt) {
    snapchanged_fired = true;
    assertSnapEvent(evt, expected_snap_target_ids);
  }
  scroller.addEventListener("snapchanged", snapChangedHandler);
  test.add_cleanup(() => {
    scroller.removeEventListener("snapchanged", snapChangedHandler);
  });

  let scrollend_promise = createScrollendPromise(scroller);
  let current_offset = getCurrentOffset(scroller);
  let target_offset = {
    x: snap_point_1.getBoundingClientRect().width + 10,
    y: snap_point_1.getBoundingClientRect().height + 10
  }
  // This change in scroll position should trigger a snap to the second
  // snap_point.
  await scrolling_function(scroller, current_offset, target_offset);
  await scrollend_promise;
  assert_equals(scroller.scrollTop,
    snap_point_1.getBoundingClientRect().height,
    "scroller snaps vertically to top of snap_point_2.");
  assert_equals(scroller.scrollLeft,
    snap_point_1.getBoundingClientRect().width,
    "scroller snaps horizontally to left border of snap_point_2.");

  // Update snap target ids.
  expected_snap_target_ids = {
    x: [ snap_point_3.id ],
    y: [ snap_point_3.id ]
  };
  scrollend_promise = createScrollendPromise(scroller);
  current_offset = getCurrentOffset(scroller);
  target_offset = {
    x: snap_point_1.getBoundingClientRect().width +
       snap_point_2.getBoundingClientRect().width + 10,
    y: snap_point_1.getBoundingClientRect().height +
       snap_point_2.getBoundingClientRect().height + 10
  };
  // This change in scroll position should trigger a snap to the third
  // snap_point.
  await scrolling_function(scroller, current_offset, target_offset);
  await scrollend_promise;

  assert_true(snapchanged_fired, "snapchanged fired");
  assert_equals(scroller.scrollTop,
    snap_point_1.getBoundingClientRect().height +
    snap_point_2.getBoundingClientRect().height,
    "scroller snaps vertically to top of snap_point_3.");
  assert_equals(scroller.scrollLeft,
    snap_point_1.getBoundingClientRect().width +
    snap_point_2.getBoundingClientRect().width,
    "scroller snaps horizontally to left border of snap_point_3.");
}