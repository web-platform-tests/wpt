'use strict';

// See `totalScheduledDeferredBytesForOrigin` in
// https://whatpr.org/fetch/1647.html#request-a-deferred-fetch
const QUOTA_PER_ORIGIN = 64 * 1024;  // 64 kilobytes per spec.
