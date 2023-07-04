// This test code is shared between resource-timing-sizes-content-encoding.html
// and resource-timing-sizes-content-encoding-worker.html

if (typeof document === 'undefined') {
    importScripts(
      '/resources/testharness.js',
      '/misc/resources/run-async-tasks-promise.js'
    );
}

const url = '/misc/resources/gzip-content-encoding.php';
const uncompressedSize = 1250;

function checkResourceSizes() {
    var absoluteUrl = new URL(url, location.href).href;
    var entries = performance.getEntriesByName(absoluteUrl);
    assert_equals(entries.length, 2, 'Wrong number of entries');
    for (var entry of entries) {
        if (entry.name === absoluteUrl) {
            assert_between_exclusive(entry.encodedBodySize, 0, uncompressedSize,
                                     'encodedBodySize');
            assert_equals(entry.decodedBodySize, uncompressedSize);
        }
    }
}

promise_test(() => {
    // Fetch twice to ensure at least one fetch comes from the cache.
    var eatBody = response => response.arrayBuffer();
    return fetch(url)
        .then(eatBody)
        .then(() => fetch(url))
        .then(eatBody)
        .then(runAsyncTasks)
        .then(checkResourceSizes);
}, 'PerformanceResourceTiming sizes compressed content test');

done();
