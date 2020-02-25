const set_timeout_function = (port) => {
  let id = 0;
  try {
    id = setTimeout(`${port}.postMessage('handler invoked')`, 100);
  } catch (e) {}
  port.postMessage(id === 0 ? "setTimeout blocked" : "setTimeout allowed");
};

if ('DedicatedWorkerGlobalScope' in self &&
    self instanceof DedicatedWorkerGlobalScope) {
  set_timeout_function(self);
} else if (
    'SharedWorkerGlobalScope' in self &&
    self instanceof SharedWorkerGlobalScope) {
  onconnect = e => {
    set_timeout_function(e.ports[0]);
  };
}
