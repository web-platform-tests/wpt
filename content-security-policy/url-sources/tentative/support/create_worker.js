// Creates a |worker_type| ("dedicated", "shared" or "service") worker from
// |script_url|, as a module worker if |type| is "module", and resolves with
// what it posts. If loading the worker's script fails, e.g. because a module it
// imports is blocked, resolves with "CSP_VIOLATION". A shared worker gets the
// name |name|, which should be unique, so that an instance from another test
// isn't reused.
function create_worker(worker_type, script_url, {type = 'classic', name} = {}) {
  return new Promise(resolve => {
    switch (worker_type) {
      case 'dedicated': {
        const worker = new Worker(script_url, {type});
        worker.onmessage = e => resolve(e.data);
        worker.onerror = () => resolve('CSP_VIOLATION');
        break;
      }
      case 'shared': {
        const worker = new SharedWorker(script_url, {name, type});
        worker.port.onmessage = e => resolve(e.data);
        worker.onerror = () => resolve('CSP_VIOLATION');
        break;
      }
      case 'service':
        // A service worker can't post to a document it doesn't control yet.
        // Its registration only succeeds if its script could be loaded and ran
        // without throwing.
        navigator.serviceWorker.register(script_url, {type}).then(
            async registration => {
              await registration.unregister();
              resolve('SCRIPT_RAN');
            },
            () => resolve('CSP_VIOLATION'));
        break;
    }
  });
}
