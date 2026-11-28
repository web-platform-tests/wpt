// META: title=MutationObserver: connectedness
"use strict";

function createElement(id) {
  const element = document.createElement("div");
  element.id = id;
  return element;
}

function label(node) {
  return node.id || node.nodeName;
}

function summarize(records) {
  return records.map(({ type, target, addedNodes, removedNodes }) => {
    let summary = `${type} ${label(target)}`;
    for (const node of addedNodes) {
      summary += ` +${label(node)}`;
    }
    for (const node of removedNodes) {
      summary += ` -${label(node)}`;
    }
    return summary;
  });
}

function connect(t, node) {
  document.body.append(node);
  t.add_cleanup(() => node.remove());
}

test(() => {
  const observer = new MutationObserver(() => {});
  observer.observe(createElement("target"), { connectedness: true });
  assert_throws_js(TypeError, () => {
    observer.observe(createElement("other"), { connectedness: false });
  });
}, "observe() accepts connectedness as the only option");

test(t => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  connect(t, target);
  target.remove();

  assert_array_equals(summarize(observer.takeRecords()), ["connected target", "disconnected target"]);
}, "Inserting into and removing from a document queues connected and disconnected records");

test(t => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  connect(t, target);
  const [record] = observer.takeRecords();
  assert_equals(record.type, "connected", "type");
  assert_equals(record.target, target, "target");
  assert_equals(record.addedNodes.length, 0, "addedNodes");
  assert_equals(record.removedNodes.length, 0, "removedNodes");
  assert_equals(record.previousSibling, null, "previousSibling");
  assert_equals(record.nextSibling, null, "nextSibling");
  assert_equals(record.attributeName, null, "attributeName");
  assert_equals(record.attributeNamespace, null, "attributeNamespace");
  assert_equals(record.oldValue, null, "oldValue");
}, "Connected records only have a type and target");

test(t => {
  const container = createElement("container");
  const target = container.appendChild(createElement("target"));
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  connect(t, container);
  container.remove();

  assert_array_equals(summarize(observer.takeRecords()), ["connected target", "disconnected target"]);
}, "Inserting and removing an ancestor queues records for the target");

test(t => {
  const container = createElement("container");
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  container.append(target);
  target.remove();
  assert_array_equals(summarize(observer.takeRecords()), []);

  connect(t, container);
  container.append(target);
  assert_array_equals(summarize(observer.takeRecords()), ["connected target"]);
}, "Inserting into and removing from a tree that is not connected queues no records");

test(t => {
  const target = document.createTextNode("text");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  connect(t, target);
  target.remove();

  assert_array_equals(summarize(observer.takeRecords()), ["connected #text", "disconnected #text"]);
}, "The connectedness of a Text node can be observed");

for (const mode of ["open", "closed"]) {
  test(t => {
    const host = createElement("host");
    const shadowRoot = host.attachShadow({ mode });
    const target = shadowRoot.appendChild(createElement("target"));
    const observer = new MutationObserver(() => {});
    observer.observe(target, { connectedness: true });

    connect(t, host);
    host.remove();

    assert_array_equals(summarize(observer.takeRecords()), ["connected target", "disconnected target"]);
  }, `Inserting and removing the host of a ${mode} shadow root queues records for a node in the shadow tree`);
}

test(t => {
  const outerHost = createElement("outerHost");
  const innerHost = outerHost.attachShadow({ mode: "open" }).appendChild(createElement("innerHost"));
  const target = innerHost.attachShadow({ mode: "closed" }).appendChild(createElement("target"));
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  connect(t, outerHost);
  outerHost.remove();

  assert_array_equals(summarize(observer.takeRecords()), ["connected target", "disconnected target"]);
}, "Records are queued for a node in a nested shadow tree");

test(t => {
  const host = createElement("host");
  const shadowRoot = host.attachShadow({ mode: "open" });
  const observer = new MutationObserver(() => {});
  observer.observe(shadowRoot, { connectedness: true });

  connect(t, host);
  host.remove();

  assert_array_equals(summarize(observer.takeRecords()), [
    "connected #document-fragment",
    "disconnected #document-fragment"
  ]);
}, "The connectedness of a shadow root can be observed");

test(t => {
  const container = createElement("container");
  connect(t, container);
  const fragment = new DocumentFragment();
  const target = fragment.appendChild(createElement("target"));
  const observer = new MutationObserver(() => {});
  observer.observe(fragment, { childList: true });
  observer.observe(container, { childList: true });
  observer.observe(target, { connectedness: true });

  container.append(fragment);

  assert_array_equals(summarize(observer.takeRecords()), [
    "childList #document-fragment -target",
    "connected target",
    "childList container +target"
  ]);
}, "Inserting a DocumentFragment queues records for its children before the record for the insertion");

test(t => {
  const container = createElement("container");
  connect(t, container);
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(container, { childList: true });
  observer.observe(target, { connectedness: true });

  container.append(target);
  target.remove();

  assert_array_equals(summarize(observer.takeRecords()), [
    "connected target",
    "childList container +target",
    "disconnected target",
    "childList container -target"
  ]);
}, "Connectedness records are queued before the record for the insertion or removal");

test(t => {
  const container = createElement("container");
  connect(t, container);
  const oldChild = container.appendChild(createElement("oldChild"));
  const newChild = createElement("newChild");
  const observer = new MutationObserver(() => {});
  observer.observe(container, { childList: true });
  observer.observe(oldChild, { connectedness: true });
  observer.observe(newChild, { connectedness: true });

  container.replaceChildren(newChild);

  assert_array_equals(summarize(observer.takeRecords()), [
    "disconnected oldChild",
    "connected newChild",
    "childList container +newChild -oldChild"
  ]);
}, "replaceChildren() queues records for the removed and inserted nodes before its own record");

test(t => {
  const container = createElement("container");
  const first = container.appendChild(createElement("first"));
  const second = first.appendChild(createElement("second"));
  const third = container.appendChild(createElement("third"));
  const observer = new MutationObserver(() => {});
  for (const node of [third, second, first]) {
    observer.observe(node, { connectedness: true });
  }

  connect(t, container);
  container.remove();

  assert_array_equals(summarize(observer.takeRecords()), [
    "connected first",
    "connected second",
    "connected third",
    "disconnected first",
    "disconnected second",
    "disconnected third"
  ]);
}, "Records for an inserted or removed subtree are queued in tree order");

test(t => {
  const target = createElement("target");
  connect(t, target);
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  target.remove();
  document.body.append(target);

  assert_array_equals(summarize(observer.takeRecords()), ["disconnected target", "connected target"]);
}, "Removing and inserting a node again queues both records");

test(t => {
  const target = createElement("target");
  connect(t, target);
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  // Unlike moveBefore(), append() first removes target from its parent.
  document.body.append(target);

  assert_array_equals(summarize(observer.takeRecords()), ["disconnected target", "connected target"]);
}, "Appending a node to the parent it is already in queues both records");

test(t => {
  const target = createElement("target");
  connect(t, target);
  const otherDocument = document.implementation.createHTMLDocument();
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  otherDocument.body.append(target);

  assert_array_equals(summarize(observer.takeRecords()), ["disconnected target", "connected target"]);
}, "Inserting a node into another document queues records, as the node is connected to that document");

test(() => {
  const template = document.createElement("template");
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  template.content.append(target);
  target.remove();

  assert_array_equals(summarize(observer.takeRecords()), []);
}, "Inserting into and removing from template contents queues no records");

test(t => {
  const container = createElement("container");
  const child = container.appendChild(createElement("child"));
  const observer = new MutationObserver(() => {});
  observer.observe(container, { connectedness: true, subtree: true });

  connect(t, container);
  container.remove();

  assert_array_equals(summarize(observer.takeRecords()), ["connected container", "disconnected container"]);
}, "subtree does not apply to connectedness");

test(t => {
  const container = createElement("container");
  connect(t, container);
  const child = container.appendChild(createElement("child"));
  const observer = new MutationObserver(() => {});
  observer.observe(container, { connectedness: true, subtree: true });

  // child stays observed as part of container's subtree until mutation observers are notified.
  child.remove();
  document.body.append(child);
  t.add_cleanup(() => child.remove());

  assert_array_equals(summarize(observer.takeRecords()), []);
}, "subtree does not apply to connectedness, also not for a removed subtree that remains observed");

test(t => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  const otherObserver = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });
  otherObserver.observe(target, { connectedness: true });

  connect(t, target);

  assert_array_equals(summarize(observer.takeRecords()), ["connected target"]);
  assert_array_equals(summarize(otherObserver.takeRecords()), ["connected target"]);
}, "Each observer gets its own records");

test(t => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });
  observer.observe(target, { attributes: true });

  connect(t, target);

  assert_array_equals(summarize(observer.takeRecords()), []);
}, "Calling observe() again without connectedness stops observing connectedness");

test(t => {
  const target = createElement("target");
  const observer = new MutationObserver(() => {});
  observer.observe(target, { connectedness: true });

  connect(t, target);
  observer.disconnect();
  target.remove();

  assert_array_equals(summarize(observer.takeRecords()), []);
}, "disconnect() drops queued connectedness records and stops observing");

promise_test(async t => {
  const target = createElement("target");
  const delivered = [];
  const observer = new MutationObserver(records => delivered.push(...summarize(records)));
  observer.observe(target, { connectedness: true });

  connect(t, target);
  target.remove();
  await new Promise(resolve => t.step_timeout(resolve, 0));

  assert_array_equals(delivered, ["connected target", "disconnected target"]);
}, "Connectedness records are delivered to the callback");
