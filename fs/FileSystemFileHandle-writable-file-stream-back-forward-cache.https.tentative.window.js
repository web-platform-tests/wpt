// META: script=/common/dispatcher/dispatcher.js
// META: script=/common/utils.js
// META: script=resources/test-helpers.js
// META: script=resources/messaging-helpers.js
// META: script=/html/browsers/browsing-the-web/back-forward-cache/resources/rc-helper.js
// META: script=/html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js
// META: timeout=long

'use strict';

for (const mode1 of WFS_MODES) {
  for (const mode2 of WFS_MODES) {
    const contentiousLocks = (mode1 !== mode2) || (mode1 === 'exclusive');
    const evictStr = contentiousLocks ? 'does evict' : 'does not evict';
    createBFCacheTest(
        {type: 'wfs', mode: mode1}, {type: 'wfs', mode: mode2},
        contentiousLocks,
        `Opening a ${mode2} WFS ${evictStr} a BFCache page with a ${mode1}` +
            ` WFS on the same file handle`);
  }
}
