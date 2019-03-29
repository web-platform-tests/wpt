// META: title=Idle Detection API: Leaks

'use strict';

promise_test(async t => {
  return new IdleDetector().start().then(
    result => {},
    error => {});
}, 'start()s, never listen()s and never stop()s.');
