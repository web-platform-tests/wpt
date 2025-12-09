self.onmessage = (evt) => {
  evt.source.postMessage({ ancestorOrigins: evt.source.ancestorOrigins });
};
