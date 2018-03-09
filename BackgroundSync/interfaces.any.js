// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://wicg.github.io/BackgroundSync/spec/

promise_test(async () => {
  const idlArray = new IdlArray();
  idlArray.add_untested_idls('interface ServiceWorkerRegistration {};');
  idlArray.add_untested_idls('[Exposed=ServiceWorker] interface ServiceWorkerGlobalScope {};');

  let text = await fetch('/interfaces/BackgroundSync.idl').then(response => response.text());
  idlArray.add_idls(text);

  idlArray.test();
  done();
}, 'Background Sync interfaces.');
