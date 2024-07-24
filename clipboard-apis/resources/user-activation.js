'use strict';

async function trySetPermission(perm, state) {
  try {
    await test_driver.set_permission({ name: perm }, state)
  } catch {
    // This is expected, as clipboard permissions are not supported by every engine
    // and also the set_permission. The permission is not required by such engines as
    // they require user activation instead.
  }
}

async function tryGrantReadPermission() {
  await trySetPermission("clipboard-read", "granted");
}

async function tryGrantWritePermission() {
  await trySetPermission("clipboard-write", "granted");
}

