self.addEventListener("message", (evt) => {
  const importModule = import(evt.data);
  importModule.then(
    (module) => self.postMessage({ success: true, module: { ...module } }),
    (error) => self.postMessage({ success: false, errorName: error.name })
  );
});
