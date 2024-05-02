'use strict';

// This script depends on the following scripts:
//    /fs/resources/messaging-helpers.js
//    /fs/resources/sandboxed-fs-test-helpers.js
//    /fs/resources/test-helpers.js
//    /fs/resources/collecting-file-system-observer.js
//    /service-worker/resources/test-helpers.sub.js

promise_test(async t => {
  function dummyCallback(records, observer) {};
  let success = true;
  try {
    const observer = new FileSystemObserver(dummyCallback);
  } catch (error) {
    success = false;
  }
  assert_true(success);
}, 'Creating a FileSystemObserver from a window succeeds');

promise_test(async t => {
  const dedicated_worker =
      create_dedicated_worker(t, kDedicatedWorkerMessageTarget);
  dedicated_worker.postMessage({type: 'create-file-system-observer'});

  const event_watcher = new EventWatcher(t, dedicated_worker, 'message');
  const message_event = await event_watcher.wait_for('message');
  const response = message_event.data;

  assert_true(response.createObserverSuccess);
}, 'Creating a FileSystemObserver from a dedicated worker succeeds');

if (self.SharedWorker !== undefined) {
  promise_test(async t => {
    const shared_worker = new SharedWorker(kSharedWorkerMessageTarget);
    shared_worker.port.start();
    shared_worker.port.postMessage({type: 'create-file-system-observer'});

    const event_watcher = new EventWatcher(t, shared_worker.port, 'message');
    const message_event = await event_watcher.wait_for('message');
    const response = message_event.data;

    assert_true(response.createObserverSuccess);
  }, 'Creating a FileSystemObserver from a shared worker succeeds');
}

promise_test(async t => {
  const scope = `${kServiceWorkerMessageTarget}?create-observer`;
  const registration =
      await create_service_worker(t, kServiceWorkerMessageTarget, scope);
  await wait_for_state(t, registration.installing, 'activated');

  registration.active.postMessage({type: 'create-file-system-observer'});

  const event_watcher = new EventWatcher(t, navigator.serviceWorker, 'message');
  const message_event = await event_watcher.wait_for('message');
  const response = message_event.data;

  assert_false(response.createObserverSuccess);
}, 'Creating a FileSystemObserver from a service worker fails');

// Wraps a `CollectingFileSystemObserver` and unobservers `handles_to_unobserve`
// after its received `num_of_records_to_observe`.
class UnobservingFileSystemObserver {
  #collectingObserver;

  #num_of_records_to_observe;
  #handles_to_unobserve;

  #called_unobserve = false;
  #records_observed_count = 0;

  constructor(root_dir, num_of_records_to_observe, handles_to_unobserve) {
    this.#collectingObserver =
        new CollectingFileSystemObserver(root_dir, this.#callback.bind(this));
    this.#num_of_records_to_observe = num_of_records_to_observe;
    this.#handles_to_unobserve = handles_to_unobserve;
  }

  #callback(records, observer) {
    this.#records_observed_count += records.length;

    // Call `unobserve` once after we've received `num_of_records_to_observe`.
    if (!this.#called_unobserve &&
        this.#records_observed_count >= this.#num_of_records_to_observe) {
      this.#handles_to_unobserve.forEach(handle => {
        observer.unobserve(handle);
      });
      this.#called_unobserve = true;
    }
  }

  getRecords() {
    return this.#collectingObserver.getRecords();
  }

  observe(handles) {
    return this.#collectingObserver.observe(handles);
  }
}

directory_test(async (t, root_dir) => {
  const total_files_to_create = 100;

  const child_dir =
      await root_dir.getDirectoryHandle(getUniqueName(), {create: true});

  // Create a `FileSystemObserver` that will unobserve `child_dir` after its
  // received half of the total files we're going to create.
  const observer = new UnobservingFileSystemObserver(
      root_dir, total_files_to_create / 2, [child_dir]);

  // Observe the child directory and create files in it.
  await observer.observe([child_dir]);
  for (let i = 0; i < total_files_to_create; i++) {
    child_dir.getFileHandle(`file${i}`, {create: true});
  }

  // Wait for `unobserve` to be called.
  const records_with_unobserve_state = await observer.getRecords();

  // No observations should have been received after unobserved has been called.
  assert_false(
      records_with_unobserve_state.some(
          ({called_unobserve}) => called_unobserve),
      'Received records after unobserve.');
}, 'Observations stop after unobserve()');

directory_test(async (t, root_dir) => {
  const total_files_to_create = 100;

  const child_dir_name = getUniqueName();
  const child_dir =
      await root_dir.getDirectoryHandle(child_dir_name, {create: true});
  const same_child_dir =
      await root_dir.getDirectoryHandle(child_dir_name, {create: false});

  // Create a `FileSystemObserver` that will unobserve `same_child_dir` after
  // its received half of the total files we're going to create.
  const observer = new UnobservingFileSystemObserver(
      root_dir, total_files_to_create / 2, [same_child_dir]);

  // Observe the child directory and create files in it.
  await observer.observe([child_dir]);
  for (let i = 0; i < total_files_to_create; i++) {
    child_dir.getFileHandle(`file${i}`, {create: true});
  }

  // Wait for `unobserve` to be called.
  const records_with_unobserve_state = await observer.getRecords();

  // No observations should have been received after unobserved has been
  // called.
  assert_false(
      records_with_unobserve_state.some(
          ({called_unobserve}) => called_unobserve),
      'Received records after unobserve.');
}, 'Can unobserve an entry with any handle that has entry as its underlying entry.');

directory_test(async (t, root_dir) => {
  const num_of_child_dirs = 5;
  const num_files_to_create_per_directory = 100;
  const total_files_to_create =
      num_files_to_create_per_directory * num_of_child_dirs;

  const child_dirs = await createDirectoryHandles(
      root_dir, getUniqueName(), getUniqueName(), getUniqueName());

  // Create a `FileSystemObserver` that will unobserve all `child_dirs` after
  // its received half of the total files we're going to create.
  const observer = new UnobservingFileSystemObserver(
      root_dir, total_files_to_create / 2, child_dirs);

  // Observe the child directories and create files in them.
  await observer.observe(child_dirs);
  for (let i = 0; i < num_files_to_create_per_directory; i++) {
    child_dirs.forEach(
        child_dir => child_dir.getFileHandle(`file${i}`, {create: true}));
  }

  // Wait for `unobserve` to be called.
  const records_with_unobserve_state = await observer.getRecords();

  // No observations should have been received after unobserved has been called.
  assert_false(
      records_with_unobserve_state.some(
          ({called_unobserve}) => called_unobserve),
      'Received records after unobserve.');
}, 'Can unobserve() multiple entries and observations stop for all of them.');

function countHandlesInRecords(handles, records) {
  const is_same_entry_array_promises =
      handles.map(handle => Promise.all(records.map(record => {
        return record.root.isSameEntry(handle);
      })));
  const is_same_entry_count_promises = is_same_entry_array_promises.map(
      is_same_entry_array_promise => is_same_entry_array_promise.then(
          array => array.filter(is_same_entry => is_same_entry).length));
  return Promise.all(is_same_entry_count_promises);
}

directory_test(async (t, root_dir) => {
  const num_of_child_dirs = 5;
  const num_files_to_create_per_directory = 100;
  const total_files_to_create =
      num_files_to_create_per_directory * num_of_child_dirs;

  const child_dirs = await createDirectoryHandles(
      root_dir, getUniqueName(), getUniqueName(), getUniqueName());
  const dir_to_unobserve_index = 0;

  const observer = new UnobservingFileSystemObserver(
      root_dir, total_files_to_create / 2,
      [child_dirs[dir_to_unobserve_index]]);

  // Observe the child directories and create files in them.
  await observer.observe(child_dirs);
  for (let i = 0; i < num_files_to_create_per_directory; i++) {
    child_dirs.forEach(
        child_dir => child_dir.getFileHandle(`file${i}`, {create: true}));
  }

  // Wait for `unobserve` to be called.
  const records_with_unobserve_state = await observer.getRecords();

  let total_handle_counts = child_dirs.map(() => 0);
  for (const {called_unobserve, records} of records_with_unobserve_state) {
    const handle_counts = await countHandlesInRecords(child_dirs, records);

    // No record should be received for the directory after its been unobserved.
    if (called_unobserve) {
      assert_equals(
          handle_counts[dir_to_unobserve_index], 0,
          'Received records after unobserve.');
    }

    handle_counts.forEach(
        (handle_count, i) => total_handle_counts[i] += handle_count);
  }

  // All directories that weren't unobserved should have received every change
  // event.
  total_handle_counts.splice(dir_to_unobserve_index, 1);
  total_handle_counts.forEach(total_handle_count => {
    assert_equals(
        total_handle_count, num_files_to_create_per_directory,
        'Didn\'t receive all changes for handle that wasn\'t unobserved.');
  });
}, 'unobserve() only stops observations for the entry it was passed.');
