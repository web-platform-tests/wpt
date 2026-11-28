// Destinations to transfer OffscreenCanvas objects to. Most are in a different agent cluster, and
// several of those typically share a process with the test document.
//
// Each destination's send() transfers an OffscreenCanvas object and resolves with what its
// receiving end reported: "message" after drawing lime to the OffscreenCanvas object,
// "messageerror", or a description of what happened instead.
//
// rendersToPlaceholder is true for destinations whose event loop updates the rendering, which is
// when the HTML Standard pushes the bitmap of an OffscreenCanvas object to its placeholder canvas
// element.
//
// The popup destination requires popups to be allowed when the tests are run manually.

"use strict";

const resources = new URL(".", document.currentScript.src);

function resourceURL(file, origin = location.origin) {
  const url = new URL(file, resources);
  return origin + url.pathname + url.search;
}

function createPlaceholderCanvas(t) {
  const canvas = document.createElement("canvas");
  canvas.width = 10;
  canvas.height = 10;
  document.body.append(canvas);
  t.add_cleanup(() => canvas.remove());
  return canvas;
}

// Returns the color of the center pixel of canvas, or the name of the exception reading it threw.
function readCanvas(canvas) {
  const probe = document.createElement("canvas");
  probe.width = canvas.width;
  probe.height = canvas.height;
  const context = probe.getContext("2d");
  try {
    context.drawImage(canvas, 0, 0);
    return Array.from(context.getImageData(5, 5, 1, 1).data);
  } catch (e) {
    return e.name;
  }
}

function isLime(value) {
  return Array.isArray(value) && value.join() === "0,255,0,255";
}

function isTransparent(value) {
  return Array.isArray(value) && value.join() === "0,0,0,0";
}

// Resolves with the first value read from canvas for which predicate returns true.
async function waitForCanvas(t, canvas, predicate) {
  let value;
  await t.step_wait(() => predicate(value = readCanvas(canvas)),
                    "The placeholder canvas element did not change as expected", 5000, 50);
  return value;
}

function post(postFunction, result) {
  try {
    postFunction();
  } catch (e) {
    return Promise.resolve(`postMessage() threw ${e.name}`);
  }
  return result;
}

async function sendToIframe(t, canvas, src, sandbox) {
  const frame = document.createElement("iframe");
  t.add_cleanup(() => frame.remove());
  if (sandbox !== undefined) {
    frame.sandbox = sandbox;
  }
  frame.src = src;
  await new Promise(resolve => {
    frame.onload = resolve;
    document.body.append(frame);
  });
  const result = new Promise(resolve => {
    window.addEventListener("message", e => {
      if (e.source === frame.contentWindow) {
        resolve(e.data);
      }
    });
  });
  return post(() => frame.contentWindow.postMessage(canvas, "*", [canvas]), result);
}

const dataURLReceiverMarkup = `<script src="${resourceURL("agent-cluster-draw.js")}"></script>
<script>
onmessage = e => parent.postMessage(drawToCanvas(e.data), "*");
onmessageerror = () => parent.postMessage("messageerror", "*");
</script>`;

const destinations = [
  {
    name: "a dedicated worker",
    rendersToPlaceholder: true,
    send(t, canvas) {
      const worker = new Worker(resourceURL("agent-cluster-receiver.js"));
      t.add_cleanup(() => worker.terminate());
      const result = new Promise(resolve => worker.onmessage = e => resolve(e.data));
      return post(() => worker.postMessage(canvas, [canvas]), result);
    }
  },
  {
    name: "a same-origin iframe",
    rendersToPlaceholder: true,
    send(t, canvas) {
      return sendToIframe(t, canvas, resourceURL("agent-cluster-receiver.html"));
    }
  },
  {
    name: "a cross-site iframe",
    rendersToPlaceholder: true,
    send(t, canvas) {
      return sendToIframe(t, canvas, resourceURL("agent-cluster-receiver.html",
                                                 get_host_info().HTTPS_NOTSAMESITE_ORIGIN));
    }
  },
  {
    // Opaque origins get their own agent cluster.
    name: "a sandboxed iframe",
    rendersToPlaceholder: true,
    send(t, canvas) {
      return sendToIframe(t, canvas, resourceURL("agent-cluster-receiver.html"), "allow-scripts");
    }
  },
  {
    name: "a data: URL iframe",
    rendersToPlaceholder: true,
    send(t, canvas) {
      return sendToIframe(t, canvas,
                          `data:text/html,${encodeURIComponent(dataURLReceiverMarkup)}`);
    }
  },
  {
    // A same-site origin that requests an origin-keyed agent cluster.
    name: "a same-site iframe with Origin-Agent-Cluster: ?1",
    rendersToPlaceholder: true,
    send(t, canvas) {
      return sendToIframe(t, canvas, resourceURL(
          "agent-cluster-receiver.html?pipe=header(Origin-Agent-Cluster,%3F1)",
          get_host_info().HTTPS_REMOTE_ORIGIN));
    }
  },
  {
    // A popup opened with noopener is in a new browsing context group. It hands the test document
    // a MessagePort through a shared worker.
    name: "a same-origin popup opened with noopener",
    rendersToPlaceholder: true,
    async send(t, canvas) {
      const name = token();
      const relay = new SharedWorker(resourceURL("agent-cluster-relay-sharedworker.js"), name);
      const port = await new Promise(resolve => {
        relay.port.onmessage = e => resolve(e.ports[0]);
        relay.port.postMessage("opener");
        window.open(resourceURL(`agent-cluster-popup.html?name=${name}`), "_blank", "noopener");
      });
      t.add_cleanup(() => port.postMessage("close"));
      const result = new Promise(resolve => port.onmessage = e => resolve(e.data));
      return post(() => port.postMessage(canvas, [canvas]), result);
    }
  },
  {
    name: "a shared worker",
    rendersToPlaceholder: false,
    send(t, canvas) {
      const worker = new SharedWorker(resourceURL("agent-cluster-receiver-sharedworker.js"),
                                      token());
      const result = new Promise(resolve => worker.port.onmessage = e => resolve(e.data));
      return post(() => worker.port.postMessage(canvas, [canvas]), result);
    }
  },
  {
    name: "a dedicated worker created by a shared worker",
    rendersToPlaceholder: false,
    async send(t, canvas) {
      const sharedWorker = new SharedWorker(resourceURL("agent-cluster-spawner-sharedworker.js"),
                                            token());
      const { port1, port2 } = new MessageChannel();
      const status = await new Promise(resolve => {
        sharedWorker.port.onmessage = e => resolve(e.data);
        sharedWorker.port.postMessage(null, [port2]);
      });
      if (status !== "ready") {
        return status;
      }
      const result = new Promise(resolve => port1.onmessage = e => resolve(e.data));
      return post(() => port1.postMessage(canvas, [canvas]), result);
    }
  },
  {
    name: "a service worker",
    rendersToPlaceholder: false,
    async send(t, canvas) {
      const scope = resourceURL(`agent-cluster-scope-${token()}`);
      const registration = await service_worker_unregister_and_register(
          t, resourceURL("agent-cluster-receiver-serviceworker.js"), scope);
      t.add_cleanup(() => {
        registration.unregister();
      });
      await wait_for_state(t, registration.installing, "activated");
      const result = new Promise(resolve => {
        navigator.serviceWorker.addEventListener("message", e => {
          if (e.data.scope === registration.scope) {
            resolve(e.data.type);
          }
        });
      });
      navigator.serviceWorker.startMessages();
      return post(() => registration.active.postMessage(canvas, [canvas]), result);
    }
  }
];
