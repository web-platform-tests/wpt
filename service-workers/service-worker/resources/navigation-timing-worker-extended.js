importScripts("/resources/testharness.js");
const timings = {}

self.addEventListener('activate', event => {
    event.waitUntil(new Promise(resolve => {
        timings.activateWorkerStart = performance.now() + performance.timeOrigin
        step_timeout(resolve, 500)
    }).then(() => timings.activateWorkerEnd = performance.now() + performance.timeOrigin));
})

self.addEventListener('fetch', event => {
    timings.handleFetchEvent = performance.now() + performance.timeOrigin;
    event.respondWith(new Promise(resolve => step_timeout(resolve, 30)).then(() =>
        new Response(new Blob([`
            <script>
                parent.postMessage(${JSON.stringify(timings)}, "*")
            </script>
    `]))));
});
