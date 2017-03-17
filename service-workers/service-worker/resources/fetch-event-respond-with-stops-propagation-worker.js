importScripts('./service-worker-recorder.js');

self.addEventListener('fetch', function(event) {
    ServiceWorkerRecorder.worker.save('first handler invoked');
    event.respondWith(new Response());
  });

self.addEventListener('fetch', function(event) {
    event.waitUntil(
      ServiceWorkerRecorder.worker.save('second handler invoked')
    );
  });
