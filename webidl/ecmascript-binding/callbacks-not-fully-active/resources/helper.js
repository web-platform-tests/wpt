'use strict';

// The state of the iframe that the callback is from, when the callback is due.
const STATES = ['fully active', 'removed', 'navigated'];

async function createRealm(t) {
  const iframe = document.createElement('iframe');
  iframe.src = '/common/blank.html';
  t.add_cleanup(() => iframe.remove());
  await new Promise(resolve => {
    iframe.onload = resolve;
    document.body.append(iframe);
  });
  const win = iframe.contentWindow;
  return {
    // Evaluates `source` in the iframe to a function, and calls it with `mark`
    // and `args`. Returns the result as `value`, and `called`, which is set to
    // true when `mark` is called.
    callback(source = 'mark => function() { mark(); }', ...args) {
      const record = {called: false};
      record.value = win.eval(source)(() => record.called = true, ...args);
      return record;
    },

    async setState(state) {
      if (state === 'removed') {
        iframe.remove();
      } else if (state === 'navigated') {
        await new Promise(resolve => {
          iframe.onload = resolve;
          iframe.src = '/common/blank.html?navigated';
        });
      }
    },
  };
}

// Only whether the callback is called is tested, not exceptions from calling it
// or from not calling it.
function ignoreExceptions(fn) {
  try {
    fn();
  } catch (e) {}
}

function assert_called_iff_fully_active(state, callback) {
  if (state === 'fully active') {
    assert_true(callback.called, 'callback is called');
  } else {
    assert_false(callback.called, 'callback is not called');
  }
}
