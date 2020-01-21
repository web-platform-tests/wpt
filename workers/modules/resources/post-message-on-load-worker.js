if ('DedicatedWorkerGlobalScope' in self &&
    self instanceof DedicatedWorkerGlobalScope) {
  source.postMessage('LOADED');
} else if ('SharedWorkerGlobalScope' in self &&
    self instanceof SharedWorkerGlobalScope) {
  self.onconnect = e => {
    e.ports[0].postMessage('LOADED');
  };
}
