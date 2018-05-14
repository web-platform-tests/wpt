[
  "a",
  "a/",
  "a//",
].forEach(input => {
  test(() => {
    assert_throws(new TypeError(), () => new URL("doesnotmatter", input));
  }, "Testing new URL with base: " + input);
});
