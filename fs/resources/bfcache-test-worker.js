import {objStore} from './bfcache-test-helpers.js';

// Functions exposed to the renderer.
const funcs = {
  openSAH: async (fileHandle, mode) => {
    const sah = await fileHandle.createSyncAccessHandle({mode});
    return objStore.store(sah);
  },
  releaseSAH: async (sahId) => {
    const sah = objStore.erase(sahId);
    await sah.close();
  },
};

// Sets up a message handler that calls the `funcName` in `funcs` with `args`
// and then postMessages the result back to the renderer. If there is an error,
// it posts the error back to the renderer.
addEventListener('message', async ({data: {funcName, args}}) => {
  try {
    const result = await funcs[funcName](...args);
    postMessage({result});
  } catch (error) {
    postMessage({error});
  }
});
