// Creates a |worker_type| ("dedicated", "shared" or "service") worker from
// |script_url|, and resolves with what it posts. A shared worker gets the name
// |name|, which should be unique, so that an instance from another test isn't
// reused.
function create_worker(worker_type, script_url, {name} = {}) {
  return new Promise(resolve => {
    switch (worker_type) {
      case 'dedicated': {
        const worker = new Worker(script_url);
        worker.onmessage = e => resolve(e.data);
        break;
      }
      case 'shared': {
        const worker = new SharedWorker(script_url, name);
        worker.port.onmessage = e => resolve(e.data);
        break;
      }
      case 'service':
        // A service worker can't post to a document it doesn't control yet.
        // Its registration only succeeds if its script could be loaded and ran
        // without throwing.
        navigator.serviceWorker.register(script_url).then(
            async registration => {
              await registration.unregister();
              resolve('SCRIPT_RAN');
            },
            () => resolve('CSP_VIOLATION'));
        break;
    }
  });
}
