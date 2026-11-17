// Imports the URL string given in the script_url parameter with import(). If
// it's allowed, the imported script tells the document that it ran. In a
// worker, also tell the document which created it whether the import
// succeeded, as a violation in a worker isn't reported to the document.
const result = import('{{GET[script_url]}}').then(() => 'SCRIPT_RAN',
                                                   () => 'CSP_VIOLATION');

if (typeof SharedWorkerGlobalScope !== 'undefined' &&
    self instanceof SharedWorkerGlobalScope) {
  self.onconnect = async e => e.ports[0].postMessage(await result);
} else if (typeof DedicatedWorkerGlobalScope !== 'undefined' &&
           self instanceof DedicatedWorkerGlobalScope) {
  result.then(message => self.postMessage(message));
}
