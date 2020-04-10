// META: global=window,worker
// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

idl_test(
  ['css-layout-api'],
  ['cssom', 'html', 'worklets'],
  idl_array => {
    idl_array.add_objects({
      // TODO: LayoutWorkletGlobalScope
      // TODO: LayoutChild
      // TODO: LayoutFragment
      // TODO: InstrinsicSizes
      // TODO: LayoutConstraints
      // TODO: ChildBreakToken
      // TODO: BreakToken
      // TODO: LayoutEdges
      // TODO: FragmentResult
    });
  }
);
