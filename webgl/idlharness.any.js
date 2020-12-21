// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js
// META: timeout=long

// https://www.khronos.org/registry/webgl/specs/latest/1.0/

'use strict';

idl_test(
  ['webgl1', 'webgl2', 'EXT_disjoint_timer_query_webgl2', 'EXT_texture_norm16', 'OVR_multiview2', 'WEBGL_compressed_texture_etc1'],
  ['dom'],
  idl_array => {
    // TODO: objects
  }
);
