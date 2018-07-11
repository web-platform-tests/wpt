// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://wicg.github.io/background-fetch/

promise_test(async () => {
<<<<<<< HEAD
  const srcs = [
    'background-fetch',
    'dedicated-workers',
    'service-workers',
    'dom'
  ];
=======
  const srcs = ['background-fetch', 'dedicated-workers', 'ServiceWorker', 'dom'];
>>>>>>> 75a99d6af02a5647b154df2091b2fe9b441da031
  const [idls, worker, serviceWorker, dom] = await Promise.all(
      srcs.map(i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

  var idlArray = new IdlArray();
  idlArray.add_idls(idls);
  idlArray.add_dependency_idls(serviceWorker);
  idlArray.add_dependency_idls(worker);
  idlArray.add_dependency_idls(dom);
  idlArray.test();
}, 'background-fetch interfaces');
