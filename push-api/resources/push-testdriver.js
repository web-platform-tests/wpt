// The push commands are vendor-specific, so browsers without them must skip
// rather than fail.
function rethrowIfUnsupported(error) {
  const message = String(error && error.message);
  if (message.includes("not implemented") ||
      message.includes("wasn't found") ||
      message.includes("unknown command")) {
    throw new OptionalFeatureUnsupportedError(message);
  }
  throw error;
}

// Buffers worker messages so tests can wait for one matching a predicate.
function messageQueue() {
  const received = [];
  const waiters = [];

  navigator.serviceWorker.addEventListener('message', event => {
    const index = waiters.findIndex(waiter => waiter.predicate(event.data));
    if (index === -1) {
      received.push(event.data);
    } else {
      waiters.splice(index, 1)[0].resolve(event.data);
    }
  });

  return function nextMessage(predicate) {
    const index = received.findIndex(predicate);
    if (index !== -1) {
      return Promise.resolve(received.splice(index, 1)[0]);
    }
    return new Promise(resolve => waiters.push({predicate, resolve}));
  };
}

async function waitForActivated(registration) {
  if (registration.active && registration.active.state === 'activated') {
    return;
  }
  const worker = registration.installing || registration.waiting;
  await new Promise(resolve => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        resolve();
      }
    });
  });
}
