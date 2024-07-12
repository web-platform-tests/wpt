let messages = [];
let channel = new BroadcastChannel('foo');

channel.addEventListener('message', event => {
  messages.push(event.data);
});
channel.postMessage('he');
channel.postMessage('ll');

function waitForEventsPromise(count) {
  return new Promise(resolve => {
    function checkMessages() {
      if (messages.length >= count) {
        channel.removeEventListener('message', checkMessages); // Cleanup
        resolve(messages.length);
      }
    }

    channel.addEventListener('message', checkMessages);
  });
}