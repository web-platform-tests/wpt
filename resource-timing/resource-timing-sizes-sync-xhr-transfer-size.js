// This test code is shared between
// resource-timing-sizes-sync-xhr-transfer-size.html and
// resource-timing-sizes-sync-xhr-transfer-size-worker.html

if (typeof document === 'undefined') {
  importScripts('/resources/testharness.js');
}

const minSize = 100;
const url = new URL(cacheBust('/resources/dummy.xml'), location.href).href;
var t = async_test('PerformanceResourceTiming sync XHR transferSize test');

function cacheBust(url) {
  return url + '?bust=' + Math.random().toString().substring(2);
}

function check() {
  var entries = performance.getEntriesByName(url);
  assert_equals(entries.length, 1, 'entries.length');
  var entry = entries[0];
  assert_greater_than(entry.transferSize, minSize, 'transferSize');
  t.done();
}

function run() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send();
  step_timeout(t.step_func(check), 0);
}

run();

done();
