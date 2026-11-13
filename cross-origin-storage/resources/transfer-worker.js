// Receives a transferred FileSystemFileHandle in a dedicated worker and
// reports back what it could do with it. Used by
// transfer.tentative.https.html.

self.addEventListener('messageerror', () => {
  self.postMessage({event: 'messageerror'});
});

self.addEventListener('message', async (e) => {
  const handle = e.data && e.data.handle;
  if (!handle) {
    self.postMessage({event: 'message', handle: false});
    return;
  }
  const result = {
    event: 'message',
    handle: true,
    isFileSystemFileHandle: handle instanceof FileSystemFileHandle,
  };
  try {
    const file = await handle.getFile();
    result.read = 'ok';
    result.text = await file.text();
  } catch (err) {
    result.read = 'error';
    result.errorName = err.name;
  }
  self.postMessage(result);
});
