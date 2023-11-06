
function snapchanged_scrollbar_track_click_helper(scroller) {
  let x, y;
  if (scroller == document.scrollingElement) {
    const scrollbar_width = window.innerWidth - document.documentElement.clientWidth;
    // Some versions of webdriver have been known to frown at non-int
    // arguments to pointerMove.
    x = Math.round(window.innerWidth - scrollbar_width / 2);
    y = Math.round(window.innerHeight - 2 * scrollbar_width);
  } else {
    const scrollbar_width = scroller.offsetWidth - scroller.clientWidth;
    const bounds = scroller.getBoundingClientRect();
    x = Math.round(bounds.right - scrollbar_width / 2);
    y = Math.round(bounds.bottom  - 2 * scrollbar_width);
  }
  return new test_driver.Actions()
    .addPointer('TestPointer', 'mouse')
    .pointerMove(x, y)
    .pointerDown()
    .addTick()
    .pointerUp()
    .send();
}

function snapchanged_touch_scroll_helper(scroller) {
  // Drag the scroller from its center to its origin.
  const start_x = scroller.clientWidth / 2;
  const start_y = scroller.clientHeight / 2;
  const end_x = 0;
  const end_y = 0;
  return new test_driver.Actions()
    .addPointer("TestPointer", "touch")
    .pointerMove(start_x, start_y)
    .pointerDown()
    .addTick()
    .pause(200)
    .pointerMove(end_x, end_y)
    .addTick()
    .pointerUp()
    .send();
}

const vertical_offset_into_scrollbar = 30;
function snapchanged_scrollbar_drag_helper(scroller, scrollbar_width, drag_amt) {
  let x, y, bounds;
  if (scroller == document.scrollingElement) {
    bounds = document.documentElement.getBoundingClientRect();
    x = window.innerWidth - Math.round(scrollbar_width / 2);
  } else {
    bounds = scroller.getBoundingClientRect();
    x = bounds.right - Math.round(scrollbar_width / 2);
  }
  y = bounds.top + vertical_offset_into_scrollbar;
  return new test_driver.Actions()
    .addPointer('TestPointer', 'mouse')
    .pointerMove(x, y)
    .pointerDown()
    .pointerMove(x, y + drag_amt)
    .addTick()
    .pointerUp()
    .send();
}
