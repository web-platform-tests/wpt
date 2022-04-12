for (const variant of ['TouchEvent', 'touchevent', 'TOUCHEVENT']) {
  test(() => {
    if (!('ontouchstart' in document)) {
      assert_throws_dom("NOT_SUPPORTED_ERR", () => {
        document.createEvent(variant);
      });
    } else {
      document.createEvent(variant);
    }
  }, `document.createEvent('${variant}') should throw if 'expose legacy touch event APIs' is false`);
}
