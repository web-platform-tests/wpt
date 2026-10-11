importScripts("agent-cluster-draw.js");
onmessage = e => e.source.postMessage({ scope: registration.scope, type: drawToCanvas(e.data) });
onmessageerror = e => e.source.postMessage({ scope: registration.scope, type: "messageerror" });
