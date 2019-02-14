[
  "frame", // This works without <frameset>, so great
  "iframe",
  "object",
  "embed",
].forEach(element => {
  [
    null,
    "",
    "initialvalue"
  ].forEach(initialNameValue => {
    async_test(t => {
      const ident = element + initialNameValue,
            frame = document.createElement(element),
            expectedNameValue = initialNameValue || "",
            listener = t.step_func(e => {
              // This is the only way to get hold of some WindowProxy objects
              const frameW = e.source;
              if (e.data.ident === ident) {
                assert_equals(frameW.name, expectedNameValue);
                frame.setAttribute("name", "meh");
                assert_equals(frameW.name, expectedNameValue);
                frame.removeAttribute("name");
                assert_equals(frameW.name, expectedNameValue);
                t.done();
              }
            });
      frame.setAttribute(element === "object" ? "data" : "src", `resources/post-to-parent.html?ident=${ident}`);
      if (initialNameValue !== null) {
        frame.setAttribute("name", initialNameValue);
      }
      t.add_cleanup(() => {
        self.removeEventListener("message", listener);
        frame.remove();
      });
      self.addEventListener("message", listener);
      document.body.append(frame);
    }, `<${element}${initialNameValue !== null ? ' name=' + initialNameValue : ''}>`);
  });
});
