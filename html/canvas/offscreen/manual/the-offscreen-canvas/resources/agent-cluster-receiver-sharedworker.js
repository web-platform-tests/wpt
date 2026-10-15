importScripts("agent-cluster-draw.js");
onconnect = connectEvent => {
  const port = connectEvent.ports[0];
  port.onmessage = e => port.postMessage(drawToCanvas(e.data));
  port.onmessageerror = () => port.postMessage("messageerror");
};
