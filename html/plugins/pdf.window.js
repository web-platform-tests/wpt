[
  "invalid",
  "octet-stream",
  "test",
  "valid"
].flatMap(suffix => (suffix === "valid") ? suffix : [suffix, suffix + "-nosniff"])
 .flatMap(suffix => [suffix, suffix + ".pdf"])
 .forEach(suffix => {
  // frame should be equivalent to iframe
  [
    "embed",
    "object",
    "iframe"
  ].forEach(element => {
    [
      "without type",
      "with type"
    ].forEach(type => {
      if (element === "iframe" && type === "with type") {
        // <iframe type> is not a thing (I hope)
        return;
      }
      const title = `${element} ${suffix} (${type})`;
      promise_test(async t => {
        const container = document.createElement("div");
        container.style.border = "1px solid";
        container.textContent = title;
        const frame = document.createElement(element);
        if (type === "with type") {
          frame.type = "application/pdf";
        }
        const source = element === "object" ? "data" : "src";
        frame[source] = "resources/portable-document-format-sample-" + suffix;
        container.append(frame);
        document.body.append(container);
      }, title);
    });
  });
});
