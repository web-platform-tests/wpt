test(t => {
  const contentDocument = document.body.appendChild(document.createElement('iframe')).contentDocument;
  t.add_cleanup(() => contentDocument.defaultView.frameElement.remove());

  const element = document.createElement("div");
  const clone = contentDocument.importNode(element);
  assert_equals(clone.customElementRegistry, contentDocument.defaultView.customElements);
}, "Cloning with global registry");

test(t => {
  const contentDocument = document.body.appendChild(document.createElement('iframe')).contentDocument;
  t.add_cleanup(() => contentDocument.defaultView.frameElement.remove());

  const element = document.createElement("div", { customElementRegistry: customElements });
  const clone = contentDocument.importNode(element);
  assert_equals(clone.customElementRegistry, contentDocument.defaultView.customElements);
}, "Cloning with explicit global registry");

test(t => {
  const contentDocument = document.body.appendChild(document.createElement('iframe')).contentDocument;
  t.add_cleanup(() => contentDocument.defaultView.frameElement.remove());

  const scoped = new CustomElementRegistry();
  const element = document.createElement("div", { customElementRegistry: scoped });
  const clone = contentDocument.importNode(element);
  assert_equals(clone.customElementRegistry, scoped);
}, "Cloning with scoped registry");

test(t => {
  const contentDocument = document.body.appendChild(document.createElement('iframe')).contentDocument;
  t.add_cleanup(() => contentDocument.defaultView.frameElement.remove());

  const element = document.createElement("div");
  const elementShadow = element.attachShadow({ mode: "open", clonable: true });
  const clone = contentDocument.importNode(element);
  assert_equals(clone.shadowRoot.customElementRegistry, contentDocument.defaultView.customElements);
}, "Cloning including shadow tree with global registry");

test(t => {
  const contentDocument = document.body.appendChild(document.createElement('iframe')).contentDocument;
  t.add_cleanup(() => contentDocument.defaultView.frameElement.remove());

  const element = document.createElement("div");
  const elementShadow = element.attachShadow({ mode: "open", clonable: true, customElementRegistry: customElements });
  const clone = contentDocument.importNode(element);
  assert_equals(clone.shadowRoot.customElementRegistry, contentDocument.defaultView.customElements);
}, "Cloning including shadow tree with explicit global registry");

test(t => {
  const contentDocument = document.body.appendChild(document.createElement('iframe')).contentDocument;
  t.add_cleanup(() => contentDocument.defaultView.frameElement.remove());

  const scoped = new CustomElementRegistry();
  const element = document.createElement("div");
  const elementShadow = element.attachShadow({ mode: "open", clonable: true, customElementRegistry: scoped });
  const clone = contentDocument.importNode(element);
  assert_equals(clone.shadowRoot.customElementRegistry, scoped);
}, "Cloning including shadow tree with scoped registry");
