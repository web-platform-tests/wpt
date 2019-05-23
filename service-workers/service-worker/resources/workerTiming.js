importScripts('/resources/testharness.js');

self.addEventListener('fetch', event => {
  event.respondWith(async function() {
    // Navigation request
    if (event.request.url.indexOf('/workerTiming-iframe.html') != -1)
      event.addPerformanceEntry(mark('navigation-mark'));

    // Subresource request
    if (event.request.url.indexOf('/empty.js') != -1)
      event.addPerformanceEntry(mark('subresource-mark'));

    return fetch(event.request);
  }());
});

// Create and return a PerformanceMark with the given name via the User Timing
// Level 2 API.
function mark(name) {
  performance.mark(name);
  let entries = performance.getEntriesByName(name);
  return entries[entries.length - 1];
}