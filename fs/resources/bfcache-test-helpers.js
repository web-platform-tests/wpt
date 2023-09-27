export const objStore = (() => {
  let idCounter = 0;
  const objs = {};
  return {
    store(obj) {
      const id = idCounter++;
      objs[id] = obj;
      return id;
    },
    erase(id) {
      const obj = objs[id];
      delete objs[id];
      return obj;
    },
  };
})();

// Call a function in `bfcache-test-worker.js`'s `funcs` object with key `func`.
// Pass the `args` array as its arguments.
//
// Will create the dedicated worker if it doesn't already exist.
export const callDedicatedWorker = (() => {
  let dedicatedWorker;

  // Returns a promise that resolves with the next dedicated worker result. Or
  // rejects if there is an error on the worker.
  function getNextDedictedWorkerResult(dedicatedWorker) {
    return new Promise((resolve, reject) => {
      dedicatedWorker.addEventListener('message', ({data}) => {
        if (data.hasOwnProperty('result')) {
          resolve(data.result);
        } else if (data.hasOwnProperty('error')) {
          reject(data.error);
        } else {
          reject(new Error(
              'Expected worker to send either error or result but received' +
              ' neither.'))
        }
      }, {once: true});
      dedicatedWorker.addEventListener('error', () => {
        reject(new Error('An error occured on the dedicated worker.'));
      }, {once: true});
    });
  }

  return function(funcName, args) {
    if (!dedicatedWorker) {
      dedicatedWorker =
          new Worker(`/fs/resources/bfcache-test-worker.js`, {type: 'module'});
    }

    dedicatedWorker.postMessage({funcName, args});
    return getNextDedictedWorkerResult(dedicatedWorker);
  }
})();
