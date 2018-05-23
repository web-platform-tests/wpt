// META: global=worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

// See https://notifications.spec.whatwg.org/

// The contents of this file are duplicated in notifications/interfaces.any.js
// as a workaround for https://github.com/w3c/web-platform-tests/issues/11105
"use strict";

promise_test(async () => {
  const sw_idl = await fetch('/interfaces/ServiceWorker.idl').then(r => r.text());
  const dedicated_workers_idl = await fetch('/interfaces/dedicated-workers.idl').then(r => r.text());
  const dom_idl = await fetch('/interfaces/dom.idl').then(r => r.text());

  const notifications_idl = await fetch('/interfaces/notifications.idl').then(r => r.text());

  var idlArray = new IdlArray();

  idlArray.add_untested_idls(sw_idl, { only: [
    'ServiceWorkerRegistration',
    'ServiceWorkerGlobalScope',
    'ExtendableEvent',
    'ExtendableEventInit',
  ] });

  idlArray.add_untested_idls(dedicated_workers_idl);
  idlArray.add_untested_idls(dom_idl, { only: [ 'Event', 'EventInit' ] });

  idlArray.add_idls(notifications_idl);

  if (!self.GLOBAL.isWorker()) {
    idlArray.add_objects({
      Notification: ['new Notification("Running idlharness.")'],
    });
  }

  idlArray.test();
  done();
}, 'notifications interfaces.');
