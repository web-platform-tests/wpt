const function_function = () => {
  let msg = 'Function() function blocked';
  try {
    msg = new Function("", "return 'Function() function allowed';")();
  } catch (e) {}
  return msg;
};
if ('DedicatedWorkerGlobalScope' in self &&
    self instanceof DedicatedWorkerGlobalScope) {
  postMessage(function_function());
} else if (
    'SharedWorkerGlobalScope' in self &&
    self instanceof SharedWorkerGlobalScope) {
  onconnect = e => {
    e.ports[0].postMessage(function_function());
  };
}
