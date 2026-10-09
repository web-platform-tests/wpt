// Creates a dedicated worker, which is in this shared worker's agent cluster, and hands it the
// MessagePort it gets from the window.
onconnect = connectEvent => {
  const port = connectEvent.ports[0];
  port.onmessage = e => {
    if (typeof Worker === "undefined") {
      port.postMessage("Worker is not exposed in SharedWorkerGlobalScope");
      return;
    }
    const worker = new Worker("agent-cluster-receiver-port.js");
    worker.onmessage = workerEvent => port.postMessage(workerEvent.data);
    worker.postMessage(null, [e.ports[0]]);
  };
};
