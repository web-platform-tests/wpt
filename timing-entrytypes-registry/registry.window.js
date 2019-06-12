// META: script=resources/utils.js

test(() => {
  assert_true(!!self.PerformanceObserver, "PerformanceObserver");
  assert_true(!!self.PerformanceObserver.supportedEntryTypes,
              "PerformanceObserver.supportedEntryTypes");
}, "PerformanceObserver.supportedEntryTypes exists");

// UPDATE HERE if new entry
[
  [ "navigation", "PerformanceNavigationTiming" ],
  [ "paint", "PerformancePaintTiming" ],
].forEach(test_support);

// UPDATE BELOW to ensure the entry gets created

// paint
if (self.document) document.head.parentNode.appendChild(document.createTextNode('text inserted on purpose'));
