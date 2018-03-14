function assert_transfer_error(transferList, exception = "DataCloneError") {
  assert_throws(exception, () => self.postMessage({ get whatever() { throw exception } }, "*", transferList));
}

test(() => {
  const b = new ArrayBuffer(1);
  assert_transfer_error([b, b]);
}, "Cannot transfer the same object twice");

test(() => {
  [self, self.document, new Image()].forEach(val => {
    assert_transfer_error([val]);
  });
}, "Cannot transfer all objects");

test(() => {
  const b = new ArrayBuffer(1);
  self.postMessage(null, "*", [b]);
  assert_transfer_error([b], new Error("hi"));
  assert_throws("DataCloneError", () => self.postMessage(null, '*', [b]));
}, "Serialize throws before a transferred detached ArrayBuffer is found");

promise_test(() => {
  return self.createImageBitmap(document.createElement("canvas")).then(bitmap => {
    bitmap.close();
    assert_transfer_error([bitmap], new Error("hi"));
    assert_throws("DataCloneError", () => self.postMessage(null, '*', [bitmap]));
  })
}, "Serialize throws before a transferred detached ImageBitmap is found");

test(() => {
  let seen = false;
  const b = new ArrayBuffer(32),
        message = {
    get a() {
      self.postMessage(null, '*', [b]);
      seen = true;
    }
  };
  assert_throws("DataCloneError", () => self.postMessage(message, '*', [b]));
  assert_true(seen);
}, "Cannot transfer an object detached while message was serialized")
