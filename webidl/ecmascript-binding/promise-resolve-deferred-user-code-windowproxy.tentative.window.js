// META: title=Web IDL promise resolution does not synchronously run user code (WindowProxy)
// META: script=/common/get-host-info.sub.js
'use strict';

// The conversion of ECMAScript values to IDL promise types
// (https://webidl.spec.whatwg.org/#js-promise) uses SafePromiseResolve
// (https://tc39.es/proposal-thenable-curtailment/#sec-safe-resolve-promise),
// which defers any steps of promise resolution that could run user code (a
// "then" getter, a Proxy trap, or a call to a "then" method) to a microtask.
//
// Scripts can define "then" on a WindowProxy, e.g. with
// `function then() {}` at global scope. Most of these tests resolve promises
// with WindowProxy objects by returning them from an underlying source's
// pull(), whose return value is converted to a Promise<undefined>.
//
// A WindowProxy can also be placed on the prototype chain of another object,
// including an interface prototype object. The final tests check that a
// "then" getter on such a WindowProxy is also deferred, using
// https://webidl.spec.whatwg.org/#resolve.

function delay(t) {
  return new Promise(resolve => t.step_timeout(resolve, 0));
}

// Returns a reader for a stream whose underlying source's pull() is |pull|,
// once start() has completed, so that read() calls pull() synchronously.
async function readerWithPull(t, pull) {
  const rs = new ReadableStream({ pull }, { highWaterMark: 0 });
  const reader = rs.getReader();
  await delay(t);
  return reader;
}

function createIframe(t, src) {
  const iframe = document.createElement('iframe');
  t.add_cleanup(() => iframe.remove());
  const loaded = new Promise(resolve => iframe.onload = resolve);
  if (src) {
    iframe.src = src;
  }
  document.body.append(iframe);
  return src ? loaded.then(() => iframe) : Promise.resolve(iframe);
}

promise_test(async t => {
  const log = [];
  Object.defineProperty(window, 'then', {
    get() {
      log.push('get then');
      return undefined;
    },
    configurable: true
  });
  t.add_cleanup(() => {
    delete window.then;
  });

  const reader = await readerWithPull(t, () => {
    log.push('pull');
    return window;
  });

  reader.read();
  log.push('read returned');
  assert_array_equals(log, ['pull', 'read returned'],
                      'then getter on the WindowProxy must not run synchronously');

  await delay(t);
  assert_array_equals(log, ['pull', 'read returned', 'get then'],
                      'then getter should run exactly once, after read returned');
}, 'then getter on a WindowProxy does not run synchronously');

promise_test(async t => {
  const log = [];
  let thenThis;
  const reader = await readerWithPull(t, c => {
    log.push('pull');
    window.then = function(resolve) {
      thenThis = this;
      log.push('then called');
      c.enqueue('a');
      resolve();
    };
    return window;
  });
  t.add_cleanup(() => {
    delete window.then;
  });

  const read = reader.read();
  log.push('read returned');
  assert_array_equals(log, ['pull', 'read returned'],
                      'then method on the WindowProxy must not be called synchronously');

  const result = await read;
  assert_equals(result.value, 'a', 'result.value');
  assert_array_equals(log, ['pull', 'read returned', 'then called']);
  assert_equals(thenThis, window, 'then should be called with the WindowProxy as this');
}, 'a WindowProxy with a then method is still adopted');

promise_test(async t => {
  const log = [];
  const iframe = await createIframe(t);
  const iframeWindow = iframe.contentWindow;
  Object.defineProperty(iframeWindow, 'then', {
    get() {
      log.push('get then');
      return undefined;
    },
    configurable: true
  });

  const reader = await readerWithPull(t, () => {
    log.push('pull');
    return iframeWindow;
  });

  reader.read();
  log.push('read returned');
  assert_array_equals(log, ['pull', 'read returned'],
                      'then getter on the WindowProxy must not run synchronously');

  await delay(t);
  assert_array_equals(log, ['pull', 'read returned', 'get then'],
                      'then getter should run exactly once, after read returned');
}, 'then getter on a same-origin iframe\'s WindowProxy does not run synchronously');

promise_test(async t => {
  const iframe = await createIframe(
      t, get_host_info().HTTP_REMOTE_ORIGIN + '/common/blank.html');
  const crossOriginWindow = iframe.contentWindow;
  assert_equals(crossOriginWindow.then, undefined,
                'then on a cross-origin WindowProxy should be undefined');

  let pullCount = 0;
  const reader = await readerWithPull(t, c => {
    ++pullCount;
    c.enqueue(pullCount);
    return crossOriginWindow;
  });

  const result1 = await reader.read();
  assert_equals(result1.value, 1, 'first result.value');

  // pull() is only called again once the promise it returned has fulfilled;
  // had it rejected, the stream would have errored.
  const result2 = await reader.read();
  assert_equals(result2.value, 2, 'second result.value');
  assert_equals(pullCount, 2, 'pull() should have been called twice');
}, 'a cross-origin WindowProxy fulfills the promise');

// Installs a "then" getter on the WindowProxy that logs lookups whose receiver
// is |receiver|.
function interceptWindowThen(t, receiver, log) {
  Object.defineProperty(window, 'then', {
    get() {
      if (this === receiver) {
        log.push('get then');
      }
      return undefined;
    },
    configurable: true
  });
  t.add_cleanup(() => {
    delete window.then;
  });
}

promise_test(async t => {
  const log = [];
  const anim = new Animation();

  const originalProto = Object.getPrototypeOf(Animation.prototype);
  Object.setPrototypeOf(Animation.prototype, window);
  t.add_cleanup(() => {
    Object.setPrototypeOf(Animation.prototype, originalProto);
  });
  interceptWindowThen(t, anim, log);

  // finish() resolves the finished promise with the animation.
  const finished = anim.finished;
  anim.finish();
  log.push('finish returned');
  assert_array_equals(log, ['finish returned'],
                      'then getter on a WindowProxy on the prototype chain must not run synchronously');

  assert_equals(await finished, anim, 'promise should be fulfilled with the animation');
  assert_array_equals(log, ['finish returned', 'get then'],
                      'then getter should run exactly once, after finish returned');
}, 'then getter on a WindowProxy on an interface prototype object\'s ' +
   'prototype chain does not run synchronously');

promise_test(async t => {
  const log = [];
  const name = 'x-promise-resolve-windowproxy';
  class C extends HTMLElement {}
  Object.setPrototypeOf(C, window);
  interceptWindowThen(t, C, log);

  const p = customElements.whenDefined(name);
  customElements.define(name, C);
  log.push('define returned');
  assert_array_equals(log, ['define returned'],
                      'then getter on a WindowProxy on the prototype chain must not run synchronously');

  assert_equals(await p, C, 'promise should be fulfilled with the constructor');
  assert_array_equals(log, ['define returned', 'get then'],
                      'then getter should run exactly once, after define returned');
}, 'then getter on a WindowProxy on a constructor\'s prototype chain does not ' +
   'run synchronously');
