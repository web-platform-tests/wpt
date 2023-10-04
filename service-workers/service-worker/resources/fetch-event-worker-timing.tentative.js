skipWaiting();
//respondeWith()
addEventListener('fetch', fetchEvent => {
  fetchEvent.respondWith(async function () {
    await fetchEvent.addPerformanceEntry(performance.mark("network request from sw start"));
    const response = await fetch(fetchEvent.request);
    await fetchEvent.addPerformanceEntry(performance.mark("network request from sw end"));
    await fetchEvent.addPerformanceEntry(performance.measure("ne!", "network request from sw start", "network request from sw end"))
    return response;
  }());
});

// TODO: input check (SW) -> mark and measure are only correct input.

// TODO: in waitUntil() (need change logic performance observer)
