importScripts('./service-worker-recorder.js');

self.addEventListener('fetch', function(event) {
  var respondLater = new Promise(function(resolve) {
    setTimeout(function() {
        try {
          event.respondWith(new Response());
          resolve('FAIL: did not throw');
        } catch (error) {
          if (error.name == 'InvalidStateError') {
            resolve('PASS');
          } else {
            resolve('FAIL: Unexpected exception: ' + error);
          }
        }
      }, 0);
    });

    event.waitUntil(respondLater
      .then(function(result) {
          return ServiceWorkerRecorder.worker.save(result);
        }));
  });
