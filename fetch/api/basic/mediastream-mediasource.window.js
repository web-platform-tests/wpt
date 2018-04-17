[
  "MediaStream",
  "MediaSource"
].forEach(val => {
  promise_test(t => {
    const media = new self[val]();
    const url = URL.createObjectURL(media);
    return promise_rejects(t, new TypeError(), fetch(url));
  }, "Cannot fetch blob: URL from a " + val);
});
