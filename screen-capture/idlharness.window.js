// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://w3c.github.io/mediacapture-screen-share/

idl_test(
  ['screen-capture'],
<<<<<<< HEAD
  ['mediacapture-streams'],
=======
  ['mediacapture-main'],
>>>>>>> 86951f8fa479b6adaa4327975225b520aef6411d
  idl_array => {
    idl_array.add_objects({
      NavigatorUserMedia: ['navigator'],
    });
<<<<<<< HEAD
  }
);
=======
  },
  'screen-capture interfaces.');
>>>>>>> 86951f8fa479b6adaa4327975225b520aef6411d
