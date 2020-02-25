const msg = "importScripts allowed";
if ('DedicatedWorkerGlobalScope' in self &&
    self instanceof DedicatedWorkerGlobalScope) {
  postMessage(msg);
} else if (
    'SharedWorkerGlobalScope' in self &&
    self instanceof SharedWorkerGlobalScope) {
  onconnect = e => {
    e.ports[0].postMessage(msg);
  };
}
