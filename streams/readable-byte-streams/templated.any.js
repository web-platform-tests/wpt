// META: global=window,worker,shadowrealm
// META: script=../resources/test-utils.js
// META: script=../resources/rs-test-templates.js
'use strict';

templatedRSThrowAfterCloseOrError('ReadableStream with byte source', (extras) => {
  return new ReadableStream({ type: 'bytes', ...extras });
});
