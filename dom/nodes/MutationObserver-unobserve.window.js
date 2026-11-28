// META: title=MutationObserver: unobserve()
"use strict";

function createElement(id) {
  const element = document.createElement("div");
  element.id = id;
  return element;
}

function summarize(records) {
  return records.map(({ type, target, addedNodes, removedNodes, attributeName }) => {
    let summary = `${type} ${target.id}`;
    for (const node of addedNodes) {
      summary += ` +${node.id}`;
    }
    for (const node of removedNodes) {
      summary += ` -${node.id}`;
    }
    if (attributeName !== null) {
      summary += ` ${attributeName}`;
    }
    return summary;
  });
}

test(() => {
  const observer = new MutationObserver(() => {});
  assert_equals(typeof observer.unobserve, "function", "unobserve() exists");
  assert_throws_js(TypeError, () => observer.unobserve());
  assert_throws_js(TypeError, () => observer.unobserve(null));
  assert_throws_js(TypeError, () => observer.unobserve({}));
}, "unobserve() requires a Node");

test(() => {
  const first = createElement("first");
  const second = createElement("second");
  const observer = new MutationObserver(() => {});
  observer.observe(first, { attributes: true });
  observer.observe(second, { attributes: true });

  observer.unobserve(first);
  first.setAttribute("data-test", "");
  second.setAttribute("data-test", "");

  assert_array_equals(summarize(observer.takeRecords()), ["attributes second data-test"]);
}, "unobserve() stops observing the target, but not other targets");

test(() => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { attributes: true });

  target.setAttribute("data-before", "");
  observer.unobserve(target);
  target.setAttribute("data-after", "");

  assert_array_equals(summarize(observer.takeRecords()), ["attributes target data-before"]);
}, "unobserve() does not affect records that are already queued");

promise_test(async t => {
  const target = createElement("target");
  const delivered = [];
  const observer = new MutationObserver(records => delivered.push(...summarize(records)));
  observer.observe(target, { attributes: true });

  target.setAttribute("data-test", "");
  observer.unobserve(target);
  await new Promise(resolve => t.step_timeout(resolve, 0));

  assert_array_equals(delivered, ["attributes target data-test"]);
}, "Records queued before unobserve() are delivered to the callback");

test(() => {
  const target = createElement("target");
  const other = createElement("other");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { attributes: true });

  observer.unobserve(other);
  target.setAttribute("data-test", "");

  assert_array_equals(summarize(observer.takeRecords()), ["attributes target data-test"]);
}, "unobserve() does nothing for a node that is not observed");

test(() => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  const otherObserver = new MutationObserver(() => {});
  observer.observe(target, { attributes: true });
  otherObserver.observe(target, { attributes: true });

  observer.unobserve(target);
  target.setAttribute("data-test", "");

  assert_array_equals(summarize(observer.takeRecords()), []);
  assert_array_equals(summarize(otherObserver.takeRecords()), ["attributes target data-test"]);
}, "unobserve() does not affect other observers of the target");

test(() => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { attributes: true });

  observer.unobserve(target);
  observer.observe(target, { attributes: true });
  target.setAttribute("data-test", "");

  assert_array_equals(summarize(observer.takeRecords()), ["attributes target data-test"]);
}, "observe() after unobserve() observes the target again");

test(() => {
  const parent = createElement("parent");
  const child = parent.appendChild(createElement("child"));
  const observer = new MutationObserver(() => {});
  observer.observe(parent, { attributes: true, subtree: true });
  observer.observe(child, { attributes: true });

  observer.unobserve(child);
  child.setAttribute("data-test", "");

  assert_array_equals(summarize(observer.takeRecords()), ["attributes child data-test"]);
}, "unobserve() does not stop observing the target through another target with subtree");

test(() => {
  const parent = createElement("parent");
  const child = parent.appendChild(createElement("child"));
  const observer = new MutationObserver(() => {});
  observer.observe(parent, { childList: true, subtree: true });

  // child remains observed through parent until mutation observers are notified.
  child.remove();
  observer.unobserve(parent);
  child.append(createElement("added"));

  assert_array_equals(summarize(observer.takeRecords()), ["childList parent -child"]);
}, "unobserve() also stops observing a subtree removed from the target");

test(() => {
  const grandparent = createElement("grandparent");
  const parent = grandparent.appendChild(createElement("parent"));
  const child = parent.appendChild(createElement("child"));
  const observer = new MutationObserver(() => {});
  observer.observe(grandparent, { attributes: true, subtree: true });
  observer.observe(parent, { childList: true, subtree: true });

  // child remains observed through both grandparent and parent.
  child.remove();
  observer.unobserve(parent);
  child.append(createElement("added"));
  child.setAttribute("data-test", "");

  assert_array_equals(summarize(observer.takeRecords()), [
    "childList parent -child",
    "attributes child data-test"
  ]);
}, "unobserve() does not stop observing a removed subtree through another target");

test(t => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  observer.unobserve(target);
  document.body.append(target);
  t.add_cleanup(() => target.remove());

  assert_array_equals(summarize(observer.takeRecords()), []);
}, "unobserve() stops observing connectedness");
