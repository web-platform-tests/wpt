onmessage = e => e.source.postMessage({ scope: registration.scope, type: "message" });
onmessageerror = e => e.source.postMessage({ scope: registration.scope, type: "messageerror" });
