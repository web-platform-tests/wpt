// Hands the MessagePort a popup sends over to the opener. Each opener and popup pair uses its own
// shared worker name.
let openerPort = null;
let popupPort = null;

onconnect = connectEvent => {
  const port = connectEvent.ports[0];
  port.onmessage = e => {
    if (e.data === "opener") {
      openerPort = port;
    } else if (e.data === "popup") {
      popupPort = e.ports[0];
    }
    if (openerPort && popupPort) {
      openerPort.postMessage(null, [popupPort]);
      openerPort = null;
      popupPort = null;
    }
  };
};
