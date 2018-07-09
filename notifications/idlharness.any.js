// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

'use strict';

// https://notifications.spec.whatwg.org/

idl_test(
  ['notifications'],
  ['service-workers', 'dom', 'html'],
  idl_array => {
    let notification, notificationEvent;
    try {
      notification = new Notification("Running idlharness.");
      notificationEvent = new NotificationEvent("Running idlharness.");
    } catch (e) {
      // Will be surfaced in idlharness.js's test_object below.
    }

    idl_array.add_objects({
      Notification: [notification],
      NotificationEvent: [notificationEvent],
    });
    if (self.isWorker) {
      idl_array.add_objects({ServiceWorkerGlobalScope: [self]});
    }
  },
  'notification interfaces.');
