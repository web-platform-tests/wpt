test(t => {
  const frame = document.body.appendChild(document.createElement("iframe")),
        body = frame.contentDocument.body;
  t.add_cleanup(() => frame.remove());
  frame.contentDocument.addEventListener("x", t.unreached_func());
  body.addEventListener("x", t.unreached_func());
  frame.contentDocument.open();
  frame.contentDocument.close();
  frame.contentDocument.dispatchEvent(new Event("x"));
  body.dispatchEvent(new Event("x"));
}, "Event listeners are to be removed");

test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  t.add_cleanup(() => frame.remove());
  let once = false;
  frame.contentDocument.addEventListener("x", () => {
    frame.contentDocument.open();
    frame.contentDocument.close();
    once = true;
  });
  frame.contentDocument.addEventListener("x", t.unreached_func());
  frame.contentDocument.dispatchEvent(new Event("x"));
  assert_true(once);
}, "Event listeners are to be removed with immediate effect");

test(t => {
  const frame = document.body.appendChild(document.createElement("iframe")),
        shadow = frame.contentDocument.body.attachShadow({ mode: "closed" }),
        shadowChild = shadow.appendChild(document.createElement("div")),
        shadowShadow = shadowChild.attachShadow({ mode: "open" }),
        nodes = [shadow, shadowChild, shadowShadow];
  t.add_cleanup(() => frame.remove());
  nodes.forEach(node => {
    node.addEventListener("x", t.unreached_func());
  });
  frame.contentDocument.open();
  frame.contentDocument.close();
  nodes.forEach(node => {
    node.dispatchEvent(new Event("x"));
  });
}, "Event listeners are to be removed from shadow trees as well");
