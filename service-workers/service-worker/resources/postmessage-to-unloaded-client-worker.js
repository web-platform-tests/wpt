let main_client, unload_client;
let resolve;

self.addEventListener('message', e => {
  if (e.data == 'syn') {
    clients.matchAll({includeUncontrolled: true}).then(clients => {
      clients.forEach(client => {
        if (client.url.indexOf('postmessage-to-unloaded-client') > -1) {
          main_client = client;
        } else if (client.url.indexOf('blank') > -1) {
          unload_client = client;
        }
      });
      e.waitUntil(new Promise(r => {
        resolve = r;
        main_client.postMessage('ack');
      }));
    });
  } else if (e.data == 'post-back-to-unloaded-client') {
    try {
      // Must throw an "InvalidStateError" DOMException.
      unload_client.postMessage('never-get-this');
    } catch(e) {
      main_client.postMessage(e.name);
    }
    resolve();
  }
});