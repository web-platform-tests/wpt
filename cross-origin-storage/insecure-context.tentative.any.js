// META: global=window,worker
//
// https://wicg.github.io/cross-origin-storage/#the-crossoriginstoragemanager-interface
//
// NavigatorCrossOriginStorage's crossOriginStorage attribute is annotated
// [SecureContext]. This file intentionally has no .https. in its name, so
// it runs over plain HTTP, where the attribute must not be exposed at all.

'use strict';

test(() => {
  assert_false(isSecureContext);
  assert_false('crossOriginStorage' in navigator);
}, '"crossOriginStorage" should not be present on navigator in an insecure context.');
