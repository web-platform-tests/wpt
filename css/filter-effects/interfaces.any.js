// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://drafts.fxtf.org/filter-effects/

promise_test(async () => {
  const srcs = ['filter-effects', 'SVG', 'html', 'dom'];
  const [filterEffectsIdl, svg, html, dom] = await Promise.all(
      srcs.map(i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

  const idlArray = new IdlArray();
  idlArray.add_idls(filterEffectsIdl);
  idlArray.add_dependency_idls(svg);
  idlArray.add_dependency_idls(html);
  idlArray.add_dependency_idls(dom);
  idlArray.test();
}, 'Filter effects interfaces.');
