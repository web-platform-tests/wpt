'use strict';

test(function() {
  // https://github.com/tc39/proposal-is-error/issues/9
  // https://github.com/whatwg/webidl/pull/1421
  if (typeof Error.isError === 'function') {
    assert_true(Error.isError(new DOMException()));
  }
});
