
// Wraps a FileSystemObserve to collect its records until it stops receiving
// them.
//
// To collect records, it sets up a directory to observe and periodically create
// files in it. If no new changes occur (outside of these file creations)
// between two file changes, then it resolves the promise returned by
// getRecords() with the records it collected.
class CollectingFileSystemObserver {
  #observer = new FileSystemObserver(this.#collectRecordsCallback.bind(this));
  #callback;

  #records_promise_and_resolvers = Promise.withResolvers();
  #collected_records = [];

  #notification_dir_handle;
  #notification_file_count = 0;
  #received_changes_since_last_notification = false;

  constructor(root_dir, callback) {
    this.#setupCollectNotification(root_dir);
    this.#callback = callback;
  }

  #getCollectNotificationName() {
    return `notification_file_${this.#notification_file_count}`;
  }

  async #setupCollectNotification(root_dir) {
    this.#notification_dir_handle =
        await root_dir.getDirectoryHandle(getUniqueName(), {create: true});
    await this.#observer.observe(this.#notification_dir_handle);
    await this.#createCollectNotification();
  }

  #createCollectNotification() {
    this.#notification_file_count++;
    return this.#notification_dir_handle.getFileHandle(
        this.#getCollectNotificationName(), {create: true});
  }

  #finishCollectingIfReady() {
    // `records` contains the notification for collecting records. Determine
    // if we should finish collecting or create the next notification.
    if (this.#received_changes_since_last_notification) {
      this.#received_changes_since_last_notification = false;
      this.#createCollectNotification();
    } else {
      this.#records_promise_and_resolvers.resolve(this.#collected_records);
    }
  }

  #groupRecords(records) {
    return Object.groupBy(records, record => {
      if (record.relativePathComponents[0] ==
          this.#getCollectNotificationName()) {
        return 'notification';
      } else {
        return 'nonNotifications';
      }
    });
  }

  #collectRecordsCallback(records, observer) {
    const {notification, nonNotifications} = this.#groupRecords(records);

    if (nonNotifications) {
      this.#collected_records.push({
        callback_return: this.#callback(nonNotifications, observer),
        records: nonNotifications,
      });

      this.#received_changes_since_last_notification = true;
    }

    if (notification) {
      this.#finishCollectingIfReady(records)
    }
  }

  getRecords() {
    return this.#records_promise_and_resolvers.promise;
  }

  observe(handles) {
    return Promise.all(handles.map(handle => this.#observer.observe(handle)));
  }
}
