"use strict";

// For now this only has per-Window tests, but we could expand it to also test per-Document

window.testIsPerWindow = propertyName => {
  test(t => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const frame = iframe.contentWindow;

    const before = frame[propertyName];
    assert_true(before !== undefined && before !== null, `window.${propertyName} must be implemented`);

    iframe.remove();

    const after = frame[propertyName];
    assert_equals(after, before);
  }, `Discarding the browsing context must not change window.${propertyName}`);

  async_test(t => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const frame = iframe.contentWindow;

    const before = frame[propertyName];
    assert_true(before !== undefined && before !== null, `window.${propertyName} must be implemented`);

    iframe.onload = t.step_func(() => {
      if (frame.location.href === "about:blank") {
        // Browsers are not reliable on whether about:blank fires the load event; see
        // https://github.com/whatwg/html/issues/490
        return;
      }

      const after = frame[propertyName];
      assert_equals(after, before);
      t.done();
    });

    iframe.src = "/common/blank.html";
  }, `Navigating from the initial about:blank must not replace window.${propertyName}`);

  async_test(t => {
    const iframe = document.createElement("iframe");

    iframe.onload = t.step_func(() => {
      const frame = iframe.contentWindow;
      const before = frame[propertyName];
      assert_true(before !== undefined && before !== null, `window.${propertyName} must be implemented`);

      frame.document.open();

      const after = frame[propertyName];
      assert_not_equals(after, before);
      t.done();
    });

    iframe.src = "/common/blank.html";
    document.body.appendChild(iframe);
  }, `document.open() must replace window.${propertyName}`);
};
