// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

idl_test(
  ['css-nav'],
  ['uievents', 'html', 'dom'],
  async idlArray => {
    idlArray.add_objects({
      Window: ['window'],
      Element: ['document.body'],
      NavigationEvent: [`new NavigationEvent('type')`],
    });
  }
);
