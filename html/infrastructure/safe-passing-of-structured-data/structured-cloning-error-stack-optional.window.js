stackTest(() => {
  return new Error('some message');
}, 'page-created Error');

stackTest(() => {
  return new DOMException('InvalidStateError', 'some message');
}, 'page-created DOMException');

stackTest(() => {
  try {
    Object.defineProperty();
  } catch (e) {
    return e;
  }
}, 'JS-engine-created TypeError');

stackTest(() => {
  try {
    HTMLParagraphElement.prototype.align;
  } catch (e) {
    return e;
  }
}, 'web API-created TypeError');

stackTest(() => {
  try {
    document.createElement('');
  } catch (e) {
    return e;
  }
}, 'web API-created DOMException');


function stackTest(errorFactory, description) {
  async_test(t => {
    const error = errorFactory();
    const originalStack = error.stack;

    if (!originalStack) {
      t.done();
      return;
    }

    const worker = new Worker('./echo.js');
    worker.onmessage = t.step_func_done(e => {
      assert_equals(e.data.stack, originalStack);
    });

    worker.postMessage(error);
  }, description);
}
