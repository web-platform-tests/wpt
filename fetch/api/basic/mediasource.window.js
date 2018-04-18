promise_test(t => {
  return promise_rejects(t, new TypeError(), fetch(URL.createObjectURL(new MediaSource())));
}, "Cannot fetch blob: URL from a MediaSource");
