[
  "frames",
  "globalThis",
  "self",
  "window"
].forEach(windowProxySelfReference => {
  test(() => {
    const frame = document.body.appendChild(document.createElement("iframe")),
          otherW = frame.contentWindow;
    assert_equals(otherW[windowProxySelfReference], otherW);
    frame.remove();
    assert_equals(otherW[windowProxySelfReference], otherW);
  }, `iframeWindow.${windowProxySelfReference} before and after removal`);

  async_test(t => {
    const otherW = window.open();
    assert_equals(otherW[windowProxySelfReference], otherW);
    otherW.close();
    assert_equals(otherW[windowProxySelfReference], otherW);
    t.step_timeout(() => {
      assert_equals(otherW.opener, null); // Ensure browsing context is discarded
      assert_equals(otherW[windowProxySelfReference], otherW);
      t.done();
    }, 500);
  }, `popupWindow.${windowProxySelfReference} before, after closing, and after discarding`)
});
