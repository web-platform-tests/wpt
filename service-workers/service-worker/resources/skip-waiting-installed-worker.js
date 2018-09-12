self.addEventListener('message', function(event) {
    var port = event.data.port;
    event.waitUntil(self.skipWaiting()
      .then(function(result) {
          if (result !== undefined) {
            port.postMessage('FAIL: Promise should be resolved with undefined');
            return;
          }

          if (self.registration.active.state !== 'activated') {
            port.postMessage(
                'FAIL: Promise should be resolved after ServiceWorker#state is set to activated');
            return;
          }

          port.postMessage('PASS');
        })
      .catch(function(e) {
          port.postMessage('FAIL: unexpected exception: ' + e);
        }));
  });
