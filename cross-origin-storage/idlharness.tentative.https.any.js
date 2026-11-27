// META: global=window,worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: timeout=long

'use strict';

// https://wicg.github.io/cross-origin-storage/

idl_test(
  ['cross-origin-storage'],
  ['html', 'dom', 'fs'],
  idl_array => {
    idl_array.add_objects({
      CrossOriginStorageManager: ['navigator.crossOriginStorage'],
    });
    if (self.GLOBAL.isWindow()) {
      idl_array.add_objects({Navigator: ['navigator']});
    } else {
      idl_array.add_objects({WorkerNavigator: ['navigator']});
    }
  }
);
