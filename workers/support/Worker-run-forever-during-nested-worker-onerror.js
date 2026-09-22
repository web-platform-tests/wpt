const worker = new Worker('ErrorEvent.js');
worker.onerror = () => {
  console.error('worker.onerror');
  postMessage('start');
  while(1);
  postMessage('after infinite loop');
};
self.onerror = (e) => {
  console.error('self.onerror');
  postMessage('self.onerror');
  return true; // Handled
};
worker.postMessage('Error Message');
