const import_scripts_function = () => {
  try {
      importScripts("/content-security-policy/support/post-message.js");
  } catch (e) {
    return "importScripts blocked";
  }
};

if ('DedicatedWorkerGlobalScope' in self &&
    self instanceof DedicatedWorkerGlobalScope) {
  postMessage(import_scripts_function());
} else if (
    'SharedWorkerGlobalScope' in self &&
    self instanceof SharedWorkerGlobalScope) {
  onconnect = e => {
    e.ports[0].postMessage(import_scripts_function());
  };
}
