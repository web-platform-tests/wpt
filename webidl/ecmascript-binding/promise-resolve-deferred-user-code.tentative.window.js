// META: title=Web IDL promise resolution does not synchronously run user code
'use strict';

// https://webidl.spec.whatwg.org/#a-promise-resolved-with and
// https://webidl.spec.whatwg.org/#resolve use SafePromiseResolve
// (https://tc39.es/proposal-thenable-curtailment/#sec-safe-resolve-promise),
// which defers any steps of promise resolution that could run user code (a
// "then" getter, a Proxy trap, or a call to a "then" method) to a microtask.
//
// customElements.whenDefined() resolves its promise with the
// author-supplied constructor, which lets us control the resolution value:
// - If the name is already defined, it returns "a promise resolved with" the
//   constructor.
// - Otherwise, define() later "resolve[s]" the pending promise with it.

let nameCounter = 0;
function uniqueName() {
  return `x-promise-resolve-${nameCounter++}`;
}

promise_test(async () => {
  const log = [];
  const name = uniqueName();
  class C extends HTMLElement {
    static get then() {
      log.push('get then');
      return undefined;
    }
  }
  customElements.define(name, C);

  const p = customElements.whenDefined(name);
  log.push('whenDefined returned');
  assert_array_equals(log, ['whenDefined returned'],
                      'then getter must not run synchronously');

  assert_equals(await p, C, 'promise should be fulfilled with the constructor');
  assert_array_equals(log, ['whenDefined returned', 'get then'],
                      'then getter should run exactly once, after whenDefined returned');
}, 'a promise resolved with: then getter on the value runs after the operation returns');

promise_test(async () => {
  const log = [];
  const name = uniqueName();
  class C extends HTMLElement {
    static get then() {
      log.push('get then');
      return undefined;
    }
  }

  const p = customElements.whenDefined(name);
  customElements.define(name, C);
  log.push('define returned');
  assert_array_equals(log, ['define returned'],
                      'then getter must not run synchronously');

  assert_equals(await p, C, 'promise should be fulfilled with the constructor');
  assert_array_equals(log, ['define returned', 'get then'],
                      'then getter should run exactly once, after define returned');
}, 'resolve: then getter on the value runs after the operation returns');

promise_test(async t => {
  const log = [];
  const name = uniqueName();
  class C extends HTMLElement {}

  // Object.prototype is on the constructor's prototype chain. Other code
  // (e.g. the test harness) may also look up "then", so only record lookups
  // on C.
  Object.defineProperty(Object.prototype, 'then', {
    get() {
      if (this === C) {
        log.push('get then');
      }
      return undefined;
    },
    configurable: true
  });
  t.add_cleanup(() => {
    delete Object.prototype.then;
  });

  const p = customElements.whenDefined(name);
  customElements.define(name, C);
  log.push('define returned');
  assert_array_equals(log, ['define returned'],
                      'Object.prototype.then getter must not run synchronously');

  assert_equals(await p, C, 'promise should be fulfilled with the constructor');
  assert_array_equals(log, ['define returned', 'get then'],
                      'Object.prototype.then getter should run exactly once, after define returned');
}, 'resolve: then getter on Object.prototype runs after the operation returns');

promise_test(async t => {
  const name = uniqueName();
  const error = new Error('then getter error');
  class C extends HTMLElement {
    static get then() {
      throw error;
    }
  }
  customElements.define(name, C);

  const p = customElements.whenDefined(name);
  await promise_rejects_exactly(t, error, p,
                                'promise should be rejected with the getter\'s exception');
}, 'a promise resolved with: a throwing then getter rejects the promise');

promise_test(async t => {
  const name = uniqueName();
  const error = new Error('then getter error');
  class C extends HTMLElement {
    static get then() {
      throw error;
    }
  }

  const p = customElements.whenDefined(name);
  customElements.define(name, C);
  await promise_rejects_exactly(t, error, p,
                                'promise should be rejected with the getter\'s exception');
}, 'resolve: a throwing then getter rejects the promise');

promise_test(async () => {
  const log = [];
  const name = uniqueName();
  let thenThis;
  let thenArgs;
  class C extends HTMLElement {
    static then(...args) {
      thenThis = this;
      thenArgs = args;
      log.push('then called');
      args[0]('adopted');
    }
  }

  const p = customElements.whenDefined(name);
  customElements.define(name, C);
  log.push('define returned');
  assert_array_equals(log, ['define returned'],
                      'then method must not be called synchronously');

  assert_equals(await p, 'adopted',
                'promise should adopt the state of the thenable');
  assert_array_equals(log, ['define returned', 'then called']);
  assert_equals(thenThis, C, 'then should be called with the value as this');
  assert_equals(thenArgs.length, 2, 'then should be called with two arguments');
  assert_equals(typeof thenArgs[0], 'function', 'first argument should be a function');
  assert_equals(typeof thenArgs[1], 'function', 'second argument should be a function');
}, 'resolve: thenables are still adopted');

promise_test(async () => {
  const log = [];
  const name = uniqueName();
  class C extends HTMLElement {
    static then(resolve) {
      log.push('then called');
      resolve();
    }
  }

  const p = customElements.whenDefined(name);
  customElements.define(name, C);
  Promise.resolve().then(() => log.push('microtask'));

  await p;
  assert_array_equals(log, ['then called', 'microtask'],
                      'then should be called in the first microtask after resolution, ' +
                      'as with ordinary promise resolution');
}, 'resolve: deferring does not add a tick before a then method is called');

promise_test(async () => {
  const log = [];
  const name = uniqueName();
  class C extends HTMLElement {}

  const p = customElements.whenDefined(name);
  p.then(() => log.push('fulfilled'));
  customElements.define(name, C);
  Promise.resolve().then(() => log.push('microtask'));

  await p;
  await Promise.resolve();
  assert_array_equals(log, ['fulfilled', 'microtask'],
                      'a value that is not thenable should fulfill the promise synchronously');
}, 'resolve: a value that is not thenable is not deferred');

promise_test(async () => {
  const log = [];
  const name = uniqueName();
  class C extends HTMLElement {}
  const proxy = new Proxy(C, {
    get(target, key, receiver) {
      if (key === 'then') {
        log.push('get then');
      }
      return Reflect.get(target, key, receiver);
    }
  });

  const p = customElements.whenDefined(name);
  customElements.define(name, proxy);
  log.push('define returned');
  assert_array_equals(log, ['define returned'],
                      'Proxy get trap for then must not run synchronously');

  assert_equals(await p, proxy, 'promise should be fulfilled with the proxy');
  assert_array_equals(log, ['define returned', 'get then'],
                      'Proxy get trap for then should run exactly once, after define returned');
}, 'resolve: Proxy traps on the value run after the operation returns');

promise_test(async () => {
  const log = [];
  const name = uniqueName();
  class C extends HTMLElement {}
  // A Proxy on the prototype chain could run user code during the lookup of
  // "then", even though C itself is an ordinary object.
  Object.setPrototypeOf(C, new Proxy(HTMLElement, {
    get(target, key, receiver) {
      if (key === 'then') {
        log.push('get then');
      }
      return Reflect.get(target, key, receiver);
    }
  }));

  const p = customElements.whenDefined(name);
  customElements.define(name, C);
  log.push('define returned');
  assert_array_equals(log, ['define returned'],
                      'Proxy get trap for then must not run synchronously');

  assert_equals(await p, C, 'promise should be fulfilled with the constructor');
  assert_array_equals(log, ['define returned', 'get then'],
                      'Proxy get trap for then should run exactly once, after define returned');
}, 'resolve: Proxy traps on the value\'s prototype chain run after the operation returns');
