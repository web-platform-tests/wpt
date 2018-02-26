function assert_transfer_error(transferList) {
  assert_throws("DATA_CLONE_ERR", () => self.postMessage({ get whatever() { throw 1 } }, "*", transferList));
}

test(() => {
  const b = new ArrayBuffer(1);
  assert_transfer_error([b, b]);
}, "Cannot transfer the same object twice");

test(() => {
  const b = new ArrayBuffer(1);
  self.postMessage(null, "*", [b]);
  assert_transfer_error([b]);
}, "Cannot transfer a detached ArrayBuffer");

test(() => {
  [self, self.document, new Image()].forEach(val => {
    assert_transfer_error([val]);
  });
}, "Cannot transfer all objects");

promise_test(() => {
  return self.createImageBitmap(document.createElement("canvas")).then(bitmap => {
    bitmap.close();
    assert_transfer_error([bitmap]);
  })
}, "Cannot transfer a detached ImageBitmap");
