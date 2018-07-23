// META: global=window,worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/hr-time/

function cast(i, t) {
  return Object.assign(i, Object.create(t));
}

idl_test(
  ['hr-time'],
  [], // Deps handled below.
  async idl_array => {
    const [html, dom] = await Promise.all(['html', 'dom'].map(
      i => fetch(`/interfaces/${i}.idl`).then(r => r.text())));

    // NOTE(lukebjerring): Manually adding untested parent interfaces until
    // https://github.com/web-platform-tests/wpt/issues/8053 is resolved.
    if (self.GLOBAL.isWorker()) {
      idl_array.add_untested_idls(html, { only: ['WorkerGlobalScope'] });
      idl_array.add_objects({ WorkerGlobalScope: ['self'] });
    } else {
      idl_array.add_untested_idls(html, { only: ['Window'] });
      idl_array.add_objects({ Window: ['self'] });
    }
    idl_array.add_objects({
      Performance: ['performance'],
    });

    idl_array.add_dependency_idls(html);
    idl_array.add_dependency_idls(dom);
  },
  'hr-time interfaces.');
