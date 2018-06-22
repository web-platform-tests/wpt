"use strict";

importScripts("/resources/testharness.js");
importScripts("/resources/WebIDLParser.js", "/resources/idlharness.js");

// https://html.spec.whatwg.org/

promise_test(async () => {
  const srcs = ["html", "dom", "cssom", "touchevents", "uievents"];
  const [html, dom, cssom, touchevents, uievents] = await Promise.all(
      srcs.map(i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

  var idlArray = new IdlArray();
  idlArray.add_idls(html);
  idlArray.add_dependency_idls(dom);
  idlArray.add_dependency_idls(cssom);
  idlArray.add_dependency_idls(touchevents);
  idlArray.add_dependency_idls(uievents);

  idlArray.add_objects({
    WorkerNavigator: ['self.navigator'],
    WebSocket: ['new WebSocket("ws://foo")'],
    CloseEvent: ['new CloseEvent("close")'],
    Worker: [],
    MessageEvent: ['new MessageEvent("message", { data: 5 })'],
    DedicatedWorkerGlobalScope: ['self'],
  });

  idlArray.test();
}, 'html interfaces');

done();
