onmessage = e => {
  const port = e.ports[0];
  port.onmessage = () => port.postMessage("message");
  port.onmessageerror = () => port.postMessage("messageerror");
  postMessage("ready");
};
