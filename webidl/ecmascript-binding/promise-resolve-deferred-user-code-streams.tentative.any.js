// META: global=window,worker
// META: title=Web IDL promise resolution does not synchronously run user code (streams)
'use strict';

// https://webidl.spec.whatwg.org/#resolve and the conversion of ECMAScript
// values to IDL promise types
// (https://webidl.spec.whatwg.org/#js-promise) use SafePromiseResolve
// (https://tc39.es/proposal-thenable-curtailment/#sec-safe-resolve-promise),
// which defers any steps of promise resolution that could run user code (a
// "then" getter, a Proxy trap, or a call to a "then" method) to a microtask.
//
// Streams resolves read() promises with platform-created result objects whose
// prototype is Object.prototype, and converts the return value of an
// underlying source's pull() to a Promise<undefined>.

function delay(t) {
  return new Promise(resolve => t.step_timeout(resolve, 0));
}

// Installs a "then" getter on Object.prototype. Every lookup is counted in the
// returned object's |count|, so that tests can check that no user code runs
// synchronously. Lookups on read() result objects whose value is |chunk| are
// also logged, so that tests can check that the result is still resolved
// through a "then" lookup, without depending on other lookups that the test
// harness or engine might perform later.
function interceptThen(t, chunk, log) {
  const lookups = { count: 0 };
  Object.defineProperty(Object.prototype, 'then', {
    get() {
      ++lookups.count;
      if (this.value === chunk) {
        log.push('get then');
      }
      return undefined;
    },
    configurable: true
  });
  t.add_cleanup(() => {
    delete Object.prototype.then;
  });
  return lookups;
}

promise_test(async t => {
  const log = [];
  const chunk = {};
  let controller;
  const rs = new ReadableStream({
    start(c) {
      controller = c;
    }
  });
  const reader = rs.getReader();
  const read = reader.read();

  const lookups = interceptThen(t, chunk, log);
  controller.enqueue(chunk);
  log.push('enqueue returned');
  assert_equals(lookups.count, 0,
                'Object.prototype.then getter must not run synchronously');
  assert_array_equals(log, ['enqueue returned']);

  const result = await read;
  assert_equals(result.value, chunk, 'result.value');
  assert_false(result.done, 'result.done');
  assert_array_equals(log, ['enqueue returned', 'get then'],
                      'Object.prototype.then getter should run exactly once, after enqueue returned');
}, 'resolve: then getter on Object.prototype does not run synchronously when ' +
   'a pending read request is fulfilled');

promise_test(async t => {
  const log = [];
  const chunk = {};
  const rs = new ReadableStream({
    start(c) {
      c.enqueue(chunk);
    }
  });
  const reader = rs.getReader();

  const lookups = interceptThen(t, chunk, log);
  const read = reader.read();
  log.push('read returned');
  assert_equals(lookups.count, 0,
                'Object.prototype.then getter must not run synchronously');
  assert_array_equals(log, ['read returned']);

  const result = await read;
  assert_equals(result.value, chunk, 'result.value');
  assert_false(result.done, 'result.done');
  assert_array_equals(log, ['read returned', 'get then'],
                      'Object.prototype.then getter should run exactly once, after read returned');
}, 'resolve: then getter on Object.prototype does not run synchronously when ' +
   'read() is fulfilled from the queue');

promise_test(async t => {
  const log = [];
  let controller;
  const rs = new ReadableStream({
    start(c) {
      controller = c;
    }
  });
  const reader = rs.getReader();

  reader.read().then(() => log.push('fulfilled'));
  controller.enqueue('a');
  Promise.resolve().then(() => log.push('microtask'));

  await delay(t);
  assert_array_equals(log, ['fulfilled', 'microtask'],
                      'a value that is not thenable should fulfill the promise synchronously');
}, 'resolve: a value that is not thenable is not deferred');

promise_test(async t => {
  const log = [];
  const thenable = {
    get then() {
      log.push('get then');
      return undefined;
    }
  };
  const rs = new ReadableStream({
    pull() {
      log.push('pull');
      return thenable;
    }
  }, { highWaterMark: 0 });
  const reader = rs.getReader();
  // Wait for start() to complete so that read() calls pull() synchronously.
  await delay(t);

  reader.read();
  log.push('read returned');
  assert_array_equals(log, ['pull', 'read returned'],
                      'then getter on the return value of pull() must not run synchronously');

  await delay(t);
  assert_array_equals(log, ['pull', 'read returned', 'get then'],
                      'then getter should run exactly once, after read returned');
}, 'conversion to Promise<T>: then getter on a callback\'s return value does ' +
   'not run synchronously');

promise_test(async t => {
  const log = [];
  const proxy = new Proxy({}, {
    get(target, key, receiver) {
      if (key === 'then') {
        log.push('get then');
      }
      return Reflect.get(target, key, receiver);
    }
  });
  const rs = new ReadableStream({
    pull() {
      log.push('pull');
      return proxy;
    }
  }, { highWaterMark: 0 });
  const reader = rs.getReader();
  await delay(t);

  reader.read();
  log.push('read returned');
  assert_array_equals(log, ['pull', 'read returned'],
                      'Proxy get trap for then must not run synchronously');

  await delay(t);
  assert_array_equals(log, ['pull', 'read returned', 'get then'],
                      'Proxy get trap for then should run exactly once, after read returned');
}, 'conversion to Promise<T>: Proxy traps on a callback\'s return value do ' +
   'not run synchronously');

promise_test(async t => {
  const log = [];
  const rs = new ReadableStream({
    pull(c) {
      log.push('pull');
      return {
        then(resolve) {
          log.push('then called');
          c.enqueue('a');
          resolve();
        }
      };
    }
  }, { highWaterMark: 0 });
  const reader = rs.getReader();
  await delay(t);

  const read = reader.read();
  log.push('read returned');
  assert_array_equals(log, ['pull', 'read returned'],
                      'then method must not be called synchronously');

  const result = await read;
  assert_equals(result.value, 'a', 'result.value');
  assert_array_equals(log, ['pull', 'read returned', 'then called']);
}, 'conversion to Promise<T>: a thenable returned from a callback is still adopted');

promise_test(async t => {
  const error = new Error('then getter error');
  const rs = new ReadableStream({
    pull() {
      return {
        get then() {
          throw error;
        }
      };
    }
  }, { highWaterMark: 0 });
  const reader = rs.getReader();
  await delay(t);

  await promise_rejects_exactly(t, error, reader.read(),
                                'read() should reject with the getter\'s exception');
}, 'conversion to Promise<T>: a throwing then getter on a callback\'s return ' +
   'value rejects the promise');
