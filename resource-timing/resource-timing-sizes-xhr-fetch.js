// This test code is shared between resource-timing-sizes-xhr-fetch.html
// and resource-timing-sizes-xhr-fetch-worker.html

if (typeof document === 'undefined') {
    importScripts('/resources/testharness.js');
}

const XHR_SYNC_URL = '/resources/dummy.xml?t=syncxhr';
const XHR_ASYNC_URL = '/resources/dummy.xml?t=asyncxhr';
const FETCH_URL = '/resources/dummy.xml?t=fetch';
var sizes = {};
sizes[XHR_SYNC_URL] = sizes[XHR_ASYNC_URL] = sizes[FETCH_URL] = 60;

const totalAsyncResources = 2;
var seenAsyncResources = 0;
var seenResources = 0;
var t = async_test('PerformanceResourceTiming sizes XHR and Fetch test');

function asyncResourceLoaded(eventOrText) {
    ++seenAsyncResources;
    if (seenAsyncResources == totalAsyncResources)
        step_timeout(t.step_func(checkResourceSizes), 0);
}

function checkSizeFields(entry, expectedSize) {
    assert_equals(entry.decodedBodySize, expectedSize, 'decodedBodySize');
    assert_equals(entry.encodedBodySize, expectedSize, 'encodedBodySize');
    // Because of caching, the value of transferSize is sensitive to the
    // execution order of layout tests, and so the result of the test should not
    // depend on it.
    assert_true(entry.transferSize !== undefined,
                'transferSize should be defined');
}

function checkResourceSizes() {
    var expectedResources = Object.keys(sizes).length;
    var entries = performance.getEntriesByType('resource');
    for (var entry of entries) {
        var urlObject = new URL(entry.name);
        var urlKey = urlObject.pathname + urlObject.search;
        var size = sizes[urlKey];
        if (size) {
            checkSizeFields(entry, size);
            ++seenResources;
        }
    }
    assert_equals(seenResources, expectedResources,
                  'seenResources');
    t.done();
}

function runTest() {
    var sync = new XMLHttpRequest();
    sync.open('GET', XHR_SYNC_URL, false);
    sync.send();
    var async = new XMLHttpRequest();
    async.open('GET', XHR_ASYNC_URL);
    async.onload = t.step_func(asyncResourceLoaded);
    async.onerror = t.step_func(() => assert_unreached('Async XHR error'));
    async.send();
    fetch(FETCH_URL)
        .then(response => response.text())
        .then(t.step_func(asyncResourceLoaded))
        .catch(t.step_func(() => assert_unreached('Fetch error')));
}

runTest();

done();
