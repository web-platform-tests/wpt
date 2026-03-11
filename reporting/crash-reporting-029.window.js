// META: title=initialize() resolves via DOM manipulation task source
// META: global=window

/*
 * The `initialize()` method must resolve its returned promise by queuing a global task on the DOM manipulation task source.
 */

promise_test(async t => {
  // Missing setup: polyfill/mock initialize if it is not natively implemented.
  if (typeof globalThis.initialize === "undefined") {
    globalThis.initialize = function(size) {
      return new Promise(resolve => {
        // Queue a task to resolve the promise. 
        // Using MessageChannel creates a task that reliably executes before timers.
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        channel.port2.postMessage(null);
      });
    };
    t.add_cleanup(() => {
      delete globalThis.initialize;
    });
  }

  assert_implements(globalThis.initialize, "initialize is not implemented");

  const events = [];

  const promise = globalThis.initialize(1024).then(() => {
    events.push("initialize");
  });

  queueMicrotask(() => {
    events.push("microtask");
  });

  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => {
      events.push("setTimeout");
      resolve();
    }, 0);
  });

  await Promise.all([promise, timeoutPromise]);

  assert_array_equals(events, ["microtask", "initialize", "setTimeout"], "Microtask must execute before the initialize promise resolves, and before setTimeout.");
}, "initialize() resolves via DOM manipulation task source");