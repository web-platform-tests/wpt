importScripts('./service-worker-recorder.js');

self.addEventListener('fetch', function(event) {
    event.waitUntil(ServiceWorkerRecorder.worker.save(event.request.url));
  });
