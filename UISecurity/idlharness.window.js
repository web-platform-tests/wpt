// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// http://w3c.github.io/webappsec-uisecurity/index.html

'use strict';

promise_test(async () => {
  const srcs = ['UISecurity', 'dom'];
  const [idl, dom] = await Promise.all(
    srcs.map(i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

  const idl_array = new IdlArray();
  idl_array.add_idls(idl);
  idl_array.add_dependency_idls(dom);

  idl_array.add_objects({
    Event: ['new Event("type")'],
    VisibilityObserver: ['new VisibilityObserver(() => {})'],
    VisibilityObserverEntry: ['new VisibilityObserverEntry(() => {})'],
  });
  idl_array.test();
}, 'picture-in-picture interfaces.');
