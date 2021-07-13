// META: script=resources/sandboxed-fs-test-helpers.js
// META: script=script-tests/FileSystemFileHandle-sync-read-write.js

// This variable allows the test to differentiate between local and sandboxed
// file systems, since createSyncAccessHandle() behavior is different each one.
const file_system_type = 'sandboxed';
