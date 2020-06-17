// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

idl_test(
  ['local-font-access'],
  ['html'],
  idl_array => {
    idl_array.add_objects({
      FontManager: ['navigator.fonts'],
      FontIterator: ['navigator.fonts.query()'],
      // TODO: FontMetadata
      // TODO: FontTableMap
    });

    if (self.GLOBAL.isWorker()) {
      idl_array.add_objects({ WorkerNavigator: ['navigator'] });
    } else {
      idl_array.add_objects({ Navigator: ['navigator'] });
    }
  }
);
