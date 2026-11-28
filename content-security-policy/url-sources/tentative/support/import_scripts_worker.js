// Imports the URL string given in the script_url parameter with
// importScripts(). If it's allowed, the imported script tells the document
// which created this worker that it ran. Otherwise importScripts() throws, and
// this worker tells the document instead. A service worker rethrows, so that
// its registration fails.
try {
  importScripts(new URLSearchParams(location.search).get('script_url'));
} catch (e) {
  if (typeof SharedWorkerGlobalScope !== 'undefined' &&
      self instanceof SharedWorkerGlobalScope) {
    self.onconnect = e => e.ports[0].postMessage('CSP_VIOLATION');
  } else if (typeof DedicatedWorkerGlobalScope !== 'undefined' &&
             self instanceof DedicatedWorkerGlobalScope) {
    self.postMessage('CSP_VIOLATION');
  } else {
    throw e;
  }
}
