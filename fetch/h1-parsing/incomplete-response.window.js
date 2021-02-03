// This only tests headers without a single newline after them for now.
// See https://github.com/whatwg/fetch/issues/472 for context.

const statusLine = "HTTP/1.1 200 OKAYISH\n";

[
  "header: value\t",
  "header: value ",
  "header: value\f",
  "header: value\r"
].forEach(input => {
  promise_test(t => {
    const message = encodeURIComponent(statusLine + input)
    return promise_rejects_js(t, TypeError, fetch(`resources/message.py?message=${message}`));
  }, `Parsing response without trailing newline (${input})`);
});
