// META: title=Web IDL promise resolution does not synchronously run user code (named properties)
'use strict';

// https://webidl.spec.whatwg.org/#resolve and the conversion of ECMAScript
// values to IDL promise types (https://webidl.spec.whatwg.org/#js-promise)
// use SafePromiseResolve
// (https://tc39.es/proposal-thenable-curtailment/#sec-safe-resolve-promise),
// which defers any steps of promise resolution that could run user code (a
// "then" getter, a Proxy trap, or a call to a "then" method) to a microtask.
//
// For a legacy platform object that supports a named property "then" and
// whose interface does not have [LegacyOverrideBuiltIns],
// [[GetOwnProperty]]("then") runs the named property visibility algorithm
// (https://webidl.spec.whatwg.org/#legacy-platform-object-property-visibility).
// That algorithm walks the object's prototype chain, calling
// [[GetPrototypeOf]] and checking for an own "then" property, so a Proxy on
// the (mutable) prototype chain has its traps run even though the object
// itself is not a Proxy.
//
// Each case is run twice: once resolving with the legacy platform object by
// returning it from an underlying source's pull(), whose return value is
// converted to a Promise<undefined>, and once resolving with an Animation
// whose prototype chain includes the legacy platform object, using
// Animation.finished.

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

// Each entry point's prepare() sets up a promise to be resolved with (or with
// an object whose prototype chain includes) |value|, and returns a function
// that synchronously resolves it and returns a promise that settles once the
// resolution has completed.
const entryPoints = [
  {
    name: 'conversion to Promise<T>',
    async prepare(t, value) {
      const reader = await readerWithPull(t, c => {
        c.enqueue('a');
        return value;
      });
      return () => reader.read();
    }
  },
  {
    name: 'resolve',
    async prepare(t, value) {
      const anim = new Animation();
      const originalProto = Object.getPrototypeOf(Animation.prototype);
      Object.setPrototypeOf(Animation.prototype, value);
      t.add_cleanup(() => {
        Object.setPrototypeOf(Animation.prototype, originalProto);
      });
      const finished = anim.finished;
      return () => {
        anim.finish();
        return finished;
      };
    }
  }
];

// Replaces the prototype of |interfacePrototype| with a Proxy that logs
// traps for the "then" property to |log|.
function interceptPrototypeChain(t, interfacePrototype, log) {
  const originalProto = Object.getPrototypeOf(interfacePrototype);
  Object.setPrototypeOf(interfacePrototype, new Proxy(originalProto, {
    getOwnPropertyDescriptor(target, key) {
      if (key === 'then') {
        log.push('getOwnPropertyDescriptor then');
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
    has(target, key) {
      if (key === 'then') {
        log.push('has then');
      }
      return Reflect.has(target, key);
    },
    get(target, key, receiver) {
      if (key === 'then') {
        log.push('get then');
      }
      return Reflect.get(target, key, receiver);
    }
  }));
  t.add_cleanup(() => {
    Object.setPrototypeOf(interfacePrototype, originalProto);
  });
}

function addFormNamedThen(t) {
  const form = document.createElement('form');
  form.name = 'then';
  document.body.append(form);
  t.add_cleanup(() => form.remove());
  return form;
}

// Each case's setup() returns the legacy platform object and the interface
// prototype object to put a Proxy above.
const cases = [
  {
    name: 'HTMLCollection with a named property "then"',
    setup(t) {
      const form = addFormNamedThen(t);
      assert_equals(document.forms.then, form,
                    'document.forms should have a named property "then"');
      return { value: document.forms, interfacePrototype: HTMLCollection.prototype };
    }
  },
  {
    name: 'HTMLCollection without a named property "then"',
    setup(t) {
      return { value: document.forms, interfacePrototype: HTMLCollection.prototype };
    }
  },
  {
    name: 'Storage with a named property "then"',
    setup(t) {
      localStorage.setItem('then', 'not callable');
      t.add_cleanup(() => localStorage.removeItem('then'));
      assert_equals(localStorage.then, 'not callable',
                    'localStorage should have a named property "then"');
      return { value: localStorage, interfacePrototype: Storage.prototype };
    }
  }
];

for (const entryPoint of entryPoints) {
  for (const c of cases) {
    promise_test(async t => {
      const { value, interfacePrototype } = c.setup(t);
      const log = [];
      interceptPrototypeChain(t, interfacePrototype, log);

      const resolve = await entryPoint.prepare(t, value);
      const p = resolve();
      log.push('returned');
      assert_array_equals(log, ['returned'],
                          'Proxy traps on the prototype chain must not run synchronously');

      await p;
      await delay(t);
      assert_greater_than(log.length, 1,
                          'the lookup of "then" should reach the Proxy after ' +
                          'the operation returned');
    }, `${entryPoint.name}: ${c.name} and a Proxy on its prototype chain`);
  }

  // With [LegacyOverrideBuiltIns], the named property visibility algorithm
  // returns before walking the prototype chain, and the named property shadows
  // the Proxy, so its traps are never run.
  promise_test(async t => {
    const form = addFormNamedThen(t);
    assert_equals(document.then, form,
                  'document should have a named property "then"');
    const log = [];
    interceptPrototypeChain(t, Document.prototype, log);

    const resolve = await entryPoint.prepare(t, document);
    await resolve();
    await delay(t);
    assert_array_equals(log, [], 'Proxy traps should not run');
  }, `${entryPoint.name}: Document ([LegacyOverrideBuiltIns]) with a named ` +
     'property "then" and a Proxy on its prototype chain');
}
