async_test(t => {
  const popup = window.open("/common/blank.html", "x");
  t.add_cleanup(() => popup.close());
  popup.onload = t.step_func(() => {
    const frame = popup.document.body.appendChild(document.createElement("iframe"));
    const frameWindow = popup[0];
    const frame2 = frameWindow.document.body.appendChild(document.createElement("iframe"));
    const frameWindow2 = frameWindow[0];
    assert_equals(frameWindow.frameElement, frame);

    const popup2 = window.open("/common/blank.html", "x");
    // Should use a message from the popup, but a timeout will do until this needs to land
    t.step_timeout(() => {
      assert_equals(popup, popup2);
      assert_equals(frameWindow.frameElement, null);
      assert_equals(frameWindow.parent, null);
      assert_equals(frameWindow.top, null);
      assert_equals(frameWindow2.frameElement, null);
      assert_equals(frameWindow2.parent, null);
      assert_equals(frameWindow2.top, null);
      t.done();
    }, 500);
  });
});
