importScripts('/common/get-host-info.sub.js');
importScripts('test-helpers.sub.js');
importScripts('./service-worker-recorder.js');

self.addEventListener('fetch', function(event) {
    var url = event.request.url;
    if (url.indexOf('fetch-request-css-base-url-style.css') != -1) {
      event.respondWith(fetch(
        get_host_info()['HTTPS_REMOTE_ORIGIN'] + base_path() +
        'fetch-request-css-base-url-style.css',
        {mode: 'no-cors'}));
    } else if (url.indexOf('dummy.png') != -1) {
      event.waitUntil(ServiceWorkerRecorder.worker.save({
          url: event.request.url,
          referrer: event.request.referrer
        }));
    }
  });
