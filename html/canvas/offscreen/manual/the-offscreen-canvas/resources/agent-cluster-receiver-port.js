importScripts("agent-cluster-draw.js");
onmessage = e => {
  const port = e.ports[0];
  port.onmessage = portEvent => port.postMessage(drawToCanvas(portEvent.data));
  port.onmessageerror = () => port.postMessage("messageerror");
  postMessage("ready");
};
