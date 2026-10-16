// Worker used by allow-origin-header-workers.tentative.https.html. It stores
// bytes on request, so that the write is made from a worker global and is
// bounded by that worker's COS scope ceiling, which "obtain the COS scope
// ceiling" derives from the worker's owner set.
//
// Messages:
//   {ping: true} -> {pong: true}
//   {hash, content, origins} -> {ok: true} or {ok: false, name, message}
// Works as a dedicated worker (including one created from a blob: URL holding
// this script's text) and as a shared worker.

async function cosCeilingWorkerHandle(data) {
  if (data.ping) {
    return {pong: true};
  }
  try {
    const handle = await navigator.crossOriginStorage.getFileHandle(
      data.hash, {create: true, origins: data.origins});
    const writable = await handle.createWritable();
    await writable.write(new Blob([data.content]));
    await writable.close();
    return {ok: true};
  } catch (e) {
    return {ok: false, name: e.name, message: e.message};
  }
}

if ('onconnect' in self) {
  self.onconnect = (event) => {
    const port = event.ports[0];
    port.onmessage = async (e) => port.postMessage(await cosCeilingWorkerHandle(e.data));
  };
} else {
  self.onmessage = async (e) => self.postMessage(await cosCeilingWorkerHandle(e.data));
}
