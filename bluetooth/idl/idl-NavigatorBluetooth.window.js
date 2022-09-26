// META: script=/resources/testdriver.js
'use strict';

test(() => {
  assert_false('bluetooth' in navigator);
}, 'navigator.bluetooth not available in insecure contexts');
