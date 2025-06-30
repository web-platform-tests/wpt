// Testing DocumentFragment with host separately as it has a different node document by design
function create(doc, localName = "div") {
  return doc.createElementNS("http://www.w3.org/1999/xhtml", localName);
}

test(t => {
  const df = document.createElement("template").content;
  const child = df.appendChild(new Text('hi'));
  assert_not_equals(df.ownerDocument, document);
  const nodeDocument = df.ownerDocument;
  document.body.appendChild(df);
  t.add_cleanup(() => child.remove());
  assert_equals(df.childNodes.length, 0);
  assert_equals(child.ownerDocument, document);
  assert_equals(df.ownerDocument, nodeDocument);
}, `appendChild() and DocumentFragment with host`);

test(() => {
  const df = document.createElement("template").content;
  const child = df.appendChild(new Text('hi'));
  const nodeDocument = df.ownerDocument;
  document.adoptNode(df);
  assert_equals(df.childNodes.length, 1);
  assert_equals(child.ownerDocument, nodeDocument);
  assert_equals(df.ownerDocument, nodeDocument);
}, `adoptNode() and DocumentFragment with host`);

[
  {
    "name": "DocumentFragment",
    "creator": doc => doc.createDocumentFragment()
  },
  {
    "name": "ShadowRoot",
    "creator": doc => create(doc).attachShadow({mode: "closed"})
  }
].forEach(({ name, creator }) => {
  test(t => {
    const doc = new Document();
    const df = creator(doc);
    const child = df.appendChild(new Text('hi'));
    assert_equals(df.ownerDocument, doc);
    document.body.appendChild(df);
    t.add_cleanup(() => child.remove());
    assert_equals(df.childNodes.length, 0);
    assert_equals(child.ownerDocument, document);
    if (name === "ShadowRoot") {
      assert_equals(df.ownerDocument, doc);
    } else {
      assert_equals(df.ownerDocument, document);
    }
  }, `appendChild() and ${name}`);

  test(() => {
    const doc = new Document();
    const df = creator(doc);
    const child = df.appendChild(new Text('hi'));
    if (name === "ShadowRoot") {
      assert_throws_dom("HierarchyRequestError", () => document.adoptNode(df));
    } else {
      document.adoptNode(df);
      assert_equals(df.childNodes.length, 1);
      assert_equals(child.ownerDocument, document);
      assert_equals(df.ownerDocument, document);
    }
  }, `adoptNode() and ${name}`);
});

test(t => {
  const doc = new Document();
  const host = create(doc);
  const shadow = host.attachShadow({mode: "closed"});
  const childHost = shadow.appendChild(create(doc, "body"));
  const childShadow = childHost.attachShadow({mode: "closed"});
  const descendant = childShadow.appendChild(new Text("hi"));
  document.body.appendChild(shadow);
  t.add_cleanup(() => childHost.remove());
  assert_equals(shadow.childNodes.length, 0);
  assert_equals(childHost.ownerDocument, document);
  assert_equals(childShadow.ownerDocument, document);
  assert_equals(descendant.ownerDocument, document);
}, "Nested ShadowRoots");
