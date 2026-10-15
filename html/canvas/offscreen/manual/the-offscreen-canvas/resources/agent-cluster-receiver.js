importScripts("agent-cluster-draw.js");
onmessage = e => postMessage(drawToCanvas(e.data));
onmessageerror = () => postMessage("messageerror");
