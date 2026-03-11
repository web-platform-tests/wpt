// META: title=delete() throws InvalidStateError before initialization

/*
 * If the `delete()` method is called and the buffer is not yet initialized, it must throw an "InvalidStateError" DOMException.
 */

test(() => {
  assert_throws_dom("InvalidStateError", () => {
    window.crashReport.delete('key');
  });
}, "delete() throws InvalidStateError before initialization");