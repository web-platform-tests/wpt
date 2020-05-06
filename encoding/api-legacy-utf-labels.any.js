// https://github.com/whatwg/encoding/issues/168
[
  "dummy",
  "unicode11utf8",
  "unicode20utf8",
  "x-unicode20utf8",
  "csunicode",
  "ucs-2",
  "unicode",
  "iso-10646-ucs-2",
  "unicodefeff",
  "unicodefffe"
].forEach(label => {
  test(() => {
    assert_throws_js(RangeError, function() { new TextDecoder(label); });
  }, `${label} is not supported by the Encoding Standard`);
});
