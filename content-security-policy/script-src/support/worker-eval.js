const eval_function = () => {
  let id = 0;
  try {
    id = eval("1 + 2 + 3");
  } catch (e) {}
  return id === 0 ? "eval blocked" : "eval allowd";
};

if ('DedicatedWorkerGlobalScope' in self &&
    self instanceof DedicatedWorkerGlobalScope) {
  postMessage(eval_function());
} else if (
    'SharedWorkerGlobalScope' in self &&
    self instanceof SharedWorkerGlobalScope) {
  onconnect = e => {
    e.ports[0].postMessage(eval_function());
  };
}
