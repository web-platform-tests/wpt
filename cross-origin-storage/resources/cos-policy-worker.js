// Worker used by permissions-policy-workers.tentative.https.html, loaded from
// its own same-origin URL (as opposed to a blob: URL). It runs as a dedicated
// worker or as a shared worker, and on request it either attempts a Cross-Origin
// Storage read for `hash` or starts a nested dedicated worker from this same
// script and relays that worker's result. It reports {ok: true} or
// {ok: false, name, message}.

async function cosPolicyRead(hash) {
  try {
    const handle = await navigator.crossOriginStorage.getFileHandle(hash);
    await handle.getFile();
    return {ok: true};
  } catch (e) {
    return {ok: false, name: e.name, message: e.message};
  }
}

function cosPolicyNested(hash) {
  return new Promise((resolve) => {
    const nested = new Worker(self.location.href);
    nested.onmessage = ({data}) => resolve(data);
    nested.onerror = () => resolve({ok: false, name: 'NestedWorkerLoadError'});
    nested.postMessage({op: 'read', hash});
  });
}

async function cosPolicyHandle(data) {
  if (data.op === 'nested') {
    return cosPolicyNested(data.hash);
  }
  return cosPolicyRead(data.hash);
}

if ('onconnect' in self) {
  self.onconnect = (e) => {
    const port = e.ports[0];
    port.onmessage = async ({data}) => port.postMessage(await cosPolicyHandle(data));
  };
} else {
  self.onmessage = async ({data}) => self.postMessage(await cosPolicyHandle(data));
}
