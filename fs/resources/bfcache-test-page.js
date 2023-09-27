import {callDedicatedWorker, objStore} from './bfcache-test-helpers.js';


// Functions to create locks on fileHandles. Each take a `fileHandle` and a
// `mode`.
const createLocks = {
  sah: async (fileHandle, mode) => {
    const sahId = await callDedicatedWorker('openSAH', [fileHandle, mode]);

    return {
      close() {
        return callDedicatedWorker('releaseSAH', [sahId]);
      }
    };
  },
  wfs(fileHandle, mode) {
    return fileHandle.createWritable({mode});
  },
};

// Creates a lock using `lockInfo`. `lockInfo` has `type` and `mode` properties.
// `type` is used to select the function in `createLocks`. `mode` is passed to
// the function which creates the lock in that `mode`.
//
// Will either return undefined if it fails or an id if it succeeds. The id
// returned is used by the remote caller to refer to the lock in subsequent
// calls. E.g. releaseLock will take the id to release the lock.
export async function createLock(lockInfo, fileName) {
  const {type, mode} = lockInfo;

  const dir = await navigator.storage.getDirectory();
  const fileHandle = await dir.getFileHandle(fileName, {create: true});

  try {
    const lock = await createLocks[type](fileHandle, mode);
    return objStore.store(lock);
  } catch (e) {
    return undefined;
  }
}

// Takes a `lockId` returned by `createLock` and releases it.
export async function releaseLock(lockId) {
  const lock = objStore.erase(lockId);
  return lock.close();
}
