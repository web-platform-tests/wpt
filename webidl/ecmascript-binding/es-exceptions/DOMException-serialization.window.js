// TODO: Remove when Chromium ships self.structuredClone()
async function performStructuredClone(value, transfer) {
  if ("structuredClone" in window) {
    return window.structuredClone(value, { transfer });
  }

  window.postMessage(value, { transfer });
  try {
    return await new Promise((resolve, reject) => {
      window.onmessage = (evt) => resolve(evt.data);
      window.onmessageerror = () => {
        reject(new DOMException("Deserialization failed.", "DataCloneError"));
      };
    });
  } finally {
    window.onmessage = window.onmessageerror = null;
  }
}

promise_test(async () => {
  const original = new DOMException();
  const clone = await performStructuredClone(original);
  assert_true(
    clone instanceof DOMException,
    "Clone is an instance of DOMException"
  );
  assert_equals(clone.name, original.name, "name property");
  assert_equals(clone.message, original.message, "message property");
  assert_equals(clone.code, original.code, "code property");
}, "DOMException serialization: basic test");

promise_test(async (t) => {
  const original = new DOMException();
  await promise_rejects_dom(
    t,
    DOMException.DATA_CLONE_ERR,
    performStructuredClone(original, [original])
  );
}, "DOMException serialization: not transferable");

promise_test(async () => {
  const original = new DOMException();
  const clone = await performStructuredClone(original);
  // This should work even if DOMException doesn't support the stack property.
  assert_equals(clone.stack, original.stack);
}, "DOMException serialization: stack property");

promise_test(async () => {
  const worker = new Worker("./support/DOMException-serialization-worker.js");
  const { value: clone, stack } = await new Promise((resolve, reject) => {
    worker.addEventListener("message", (evt) => resolve(evt.data));
    worker.addEventListener("messageerror", () => {
      reject(new DOMException("Deserialization failed.", "DataCloneError"));
    });
    worker.addEventListener("error", (evt) => {
      // `evt.error` is null
      reject(evt.message);
      evt.preventDefault();
    });
  });
  worker.terminate();
  // This should work even if DOMException doesn't support the stack property.
  assert_equals(clone.stack, stack);
}, "DOMException serialization: stack property from worker");

promise_test(async (t) => {
  const iframe = document.createElement("iframe");
  iframe.src = "./support/DOMException-serialization-iframe.html";
  document.body.appendChild(iframe);
  t.add_cleanup(() => iframe.remove());

  const { value: clone, stack } = await new Promise((resolve, reject) => {
    window.addEventListener("message", (evt) => resolve(evt.data));
    window.addEventListener("messageerror", (evt) => {
      reject(new DOMException("Deserialization failed.", "DataCloneError"));
    });
    iframe.contentWindow.addEventListener("error", (evt) => {
      reject(evt.error);
      evt.preventDefault();
    });
  });

  // This should work even if DOMException doesn't support the stack property.
  assert_equals(clone.stack, stack);
}, "DOMException serialization: stack property from iframe");
