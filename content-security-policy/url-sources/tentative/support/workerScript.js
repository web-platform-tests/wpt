// Tells the document which created this worker, or which created the worker
// that imported this script, that it ran. A service worker doesn't need to, as
// its registration only succeeds if it ran.
if (typeof SharedWorkerGlobalScope !== 'undefined' &&
    self instanceof SharedWorkerGlobalScope) {
  self.onconnect = e => e.ports[0].postMessage('SCRIPT_RAN');
} else if (typeof DedicatedWorkerGlobalScope !== 'undefined' &&
           self instanceof DedicatedWorkerGlobalScope) {
  self.postMessage('SCRIPT_RAN');
}
