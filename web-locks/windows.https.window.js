// META: title=Web Locks API: Windows
// META: script=resources/helpers.js

"use strict";

promise_test(async (t) => {
  const res = uniqueName(t);
  const w = await new Promise((resolve) => {
    const w = window.open("resources/window.html");
    w.addEventListener('load', () => { resolve(w); }, { once: true });
    t.add_cleanup(() => w.close());
    return w;
  });
  await acquireLockInWorkerOfWindow(w, res);

  w.close();
  await new Promise((r) => setTimeout(r, 500));

  // Lock should be released once the window is closed.
  const { held } = await navigator.locks.query();
  for (const { name } of held) {
    assert_false(name == res, 'Lock not held after closing page.');
  }
}, 'Closed window with worker holding lock');

promise_test(async (t) => {
  const res = uniqueName(t);
  const w = await new Promise((resolve) => {
    const w = window.open("resources/window.html");
    w.addEventListener('load', () => { resolve(w); }, { once: true });
    t.add_cleanup(() => w.close());
    return w;
  });
  await acquireLockInWorkerOfWindow(w, res);

  w.location.href = 'resources/window.html?refresh=1';
  await new Promise((r) => setTimeout(r, 500));

  // Lock should be released since the URL changed and the window no longer
  // references a worker.
  const { held } = await navigator.locks.query();
  w.close();
  for (const { name } of held) {
    assert_false(name == res, 'Lock not held after closing page.');
  }
}, 'Refreshed window with worker holding lock');

function acquireLockInWorkerOfWindow(window, lockName) {
  const {port1, port2} = new MessageChannel();
  const acquiredLock = new Promise((resolve) => {
    port1.onmessage = (_) => resolve();
  });

  // Make popup acquire a lock in a worker.
  window.postMessage(
    { port: port2, worker: {op: 'request', name: lockName, mode: 'exclusive'}},
    '*',
    [port2]
  );
  return acquiredLock;
}
