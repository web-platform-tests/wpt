const channel = new BroadcastChannel('foo');  // Access shared channel
channel.addEventListener('message', event => {
  channel.postMessage('Message received in worker: ' + event.data);
});