// META: title=moveBefore() and MutationObserver: connectedness
"use strict";

test(t => {
  const oldParent = document.body.appendChild(document.createElement("div"));
  const newParent = document.body.appendChild(document.createElement("div"));
  t.add_cleanup(() => {
    oldParent.remove();
    newParent.remove();
  });
  const target = oldParent.appendChild(document.createElement("div"));
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  newParent.moveBefore(target, null);

  assert_array_equals(observer.takeRecords(), []);
}, "[Connected move] moveBefore() queues no connectedness records");

test(() => {
  const root = document.createElement("div");
  const oldParent = root.appendChild(document.createElement("div"));
  const newParent = root.appendChild(document.createElement("div"));
  const target = oldParent.appendChild(document.createElement("div"));
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  newParent.moveBefore(target, null);

  assert_array_equals(observer.takeRecords(), []);
}, "[Disconnected move] moveBefore() queues no connectedness records");
