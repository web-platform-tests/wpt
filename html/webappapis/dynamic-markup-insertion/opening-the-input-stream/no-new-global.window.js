async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  frame.src = "resources/global-variables-frame.html";
  frame.onload = t.step_func_done(() => {
    assert_equals(frame.contentWindow.hey, "You", "precondition");
    frame.contentDocument.open();
    assert_equals(frame.contentWindow.hey, "You", "actual check");
    // Ensure a load event gets dispatched to unblock testharness
    frame.contentDocument.close();
  });
}, "Obtaining a variable from a global whose document had open() invoked");

function testIdentity(desc, frameToObject, frameToConstructor) {
  async_test(t => {
    const frame = document.body.appendChild(document.createElement("iframe"));
    t.add_cleanup(() => frame.remove());
    frame.src = "/common/blank.html";
    frame.onload = t.step_func_done(() => {
      const obj = frameToObject(frame);
      frame.contentDocument.open();
      assert_equals(frameToObject(frame), obj);
      // Ensure a load event gets dispatched to unblock testharness
      frame.contentDocument.close();
    });
  }, `${desc} maintains object identity through open()`);

  async_test(t => {
    const frame = document.body.appendChild(document.createElement("iframe"));
    t.add_cleanup(() => frame.remove());
    frame.src = "/common/blank.html";
    frame.onload = t.step_func_done(() => {
      const obj = frameToObject(frame);
      const origProto = Object.getPrototypeOf(obj);
      const origCtor = frameToConstructor(frame);
      const sym = Symbol();
      obj[sym] = "foo";
      frame.contentDocument.open();
      assert_equals(frameToObject(frame)[sym], "foo");
      assert_true(frameToObject(frame) instanceof origCtor);
      assert_equals(Object.getPrototypeOf(frameToObject(frame)), origProto);
      assert_equals(frameToConstructor(frame), origCtor);
      // Ensure a load event gets dispatched to unblock testharness
      frame.contentDocument.close();
    });
  }, `${desc} maintains its prototype and properties through open()`);
}

testIdentity("Document", frame => frame.contentDocument, frame => frame.contentWindow.Document);
testIdentity("WindowProxy", frame => frame.contentWindow, frame => frame.contentWindow.Window);
testIdentity("Navigator", frame => frame.contentWindow.navigator, frame => frame.contentWindow.Navigator);
