importScripts("/resources/testharness.js");

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  clients.claim();
});

var client = null;
var popup_client = null;
self.initialize = function() {
  return self.clients.matchAll().then(function(clients) {
    for (let c of clients) {
      if (c.url.endsWith("service-worker.https.sub.html")) {
        client = c;
      }
      if (c.url.endsWith("empty.html")) {
        popup_client = c;
      }
    }
  });
}

var windowClientIsValid;
function navigatePopupToHttp() {
  var cross_origin_url = new URL(self.location.origin + '/https-upgrades/tentative/service-worker/resources/popup.html');
  cross_origin_url.protocol = "http:";
  popup_client.navigate(cross_origin_url.href).then(function(windowClient) {
    windowClientIsValid = !!windowClient;
  });
}


self.onmessage = function(e) {
  if (e.data == 'start') {
    e.waitUntil(initialize().then(function() {
      navigatePopupToHttp();
    }));
  }
  if (e.data == "popup_opened") {
    client.postMessage({message: "done", windowClientIsValid: windowClientIsValid});
  }
};
