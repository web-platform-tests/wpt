self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  clients.claim();
});

var client = null;
self.initialize = function() {
  return self.clients.matchAll().then(function(clients) {
    for (let c of clients) {
      if (c.url.endsWith("service-worker.https.sub.html")) {
        client = c;
      }
    }
  });
}

function synthesizeNotificationClick() {
    var promise = new Promise(function(resolve) {
        var title = "fake notification";
        registration.showNotification(title).then(function() {
          client.postMessage({message:'click'});
        });

        var handler = function(e) {
            resolve(e);
            // To allow waitUntil to be called inside execution of the microtask
            // enqueued by above resolve function.
            e.waitUntil(Promise.resolve());
            e.notification.close();
            self.removeEventListener('notificationclick', handler);
        };

        self.addEventListener('notificationclick', handler);
    });

    return promise;
}

function testOpenWindow(source) {
  synthesizeNotificationClick().then(function(e) {
    var cross_origin_url = self.location.origin + '/serviceworker/resources/blank.html';
    if (self.location.protocol == "https") {
      // Load the http version of this origin. Https-Upgrades should upgrade it to https.
      cross_origin_url = cross_origin_url.replace('https://', 'http://');
    }

    clients.openWindow(cross_origin_url).then(function(windowClient) {
        client.postMessage({message: 'done', windowClientIsValid: !!windowClient});
    });
  });
}

self.onmessage = function(e) {
  if (e.data == 'start') {
    e.waitUntil(initialize().then(function() {
      testOpenWindow(e.source);
    }));
  }
};
