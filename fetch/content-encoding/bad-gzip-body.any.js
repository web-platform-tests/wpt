promise_test((test) => {
    return fetch("../resources/bad-content-encoding.py");
}, "Fetching a resource with bad gzip content should still resolve");

[
  "arrayBuffer",
  "blob",
  "formData",
  "json",
  "text"
].forEach(method => {
  promise_test(t => {
    return promise_rejects(t,
                           new TypeError(),
                           fetch("resources/bad-gzip-body.py").then(res => res[method]()));
  }, "Consuming the body of a resource with bad gzip content with " + method + "() should reject");
})
