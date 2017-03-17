'use strict';
// ServiceWorkerRecorder.js
//
// A set of utility functions for tracking arbitrary events during the lifetime
// of a Service Worker. Although Service Workers may be written to store state
// in the global scope and provide it to clients on demand, this practice is
// volatile because the user agent may terminate workers at any moment. This
// utility provides persistence across terminations by storing state in an
// IndexedDB instance.
//
// The available methods, their signatures, and their expected usage are
// defined below. The methods defined in the `ServieWorkerRecorder.worker`
// namespace are intended for use within Service Worker contexts; the methods
// defined in the `ServiceWorkerRecorder.client` namespace are intended for use
// in client contexts. Note that this script must be included in both the
// Service Worker context and the client's context in order for the provided
// methods to function as intended.
self.ServiceWorkerRecorder = (function() {
  var dbName = 'service-worker-recorder.js';
  var storeName = 'events';
  var fileName = location.toString();
  var start = new Date().getTime();
  var ServiceWorkerRecorder = { client: {}, worker: {} };
  var scope;

  if (typeof registration !== 'undefined') {
    scope = registration.scope;
  }

  function connect() {
    return new Promise(function(resolve, reject) {
        var request = indexedDB.open(dbName);
        request.onerror = reject;
        request.onblocked = function() {
          reject(new Error('service-worker-recorder.js: database is blocked'));
        };
        request.onupgradeneeded = function(event) {
          var db = event.target.result;
          var events = db.createObjectStore(storeName, { autoIncrement: true });
          events.createIndex(
            'byNameScopeAndTime', ['fileName', 'scope', 'timeStamp']
          );
        };
        request.onsuccess = function(event) {
          resolve(event.target.result);
        };
      });
  }

  function clientSend(worker, topic, value) {
    return new Promise(function(resolve, reject) {
        function onMessage(event) {
          resolve(event.data);
        }
        var channel = new MessageChannel();
        var data = {port: channel.port2, topic: topic, value: value};
        channel.port1.onmessage = onMessage;
        worker.postMessage(data, [channel.port2]);
      });
  }

  function onMessage(event) {
    var topic = event.data && event.data.topic;
    var operation = null;

    if (topic === 'service-worker-recorder.js:clear') {
      operation = ServiceWorkerRecorder.worker.clear;
    } else if (topic === 'service-worker-recorder.js:save') {
      operation = ServiceWorkerRecorder.worker.save;
    } else if (topic === 'service-worker-recorder.js:read') {
      operation = ServiceWorkerRecorder.worker.read;
    }

    if (operation) {
      event.waitUntil(operation().then(function(result) {
          event.data.port.postMessage(result);
        }));
    }
  }

  /**
   * Remove all records that were inserted prior to the current moment.
   *
   * @returns {Promise}
   */
  ServiceWorkerRecorder.worker.clear = function() {
    var timeStamp = start + performance.now();

    return connect().then(function(db) {
        var transaction = db.transaction([storeName], 'readwrite');
        var store = transaction.objectStore(storeName)
        var lowerBound = [fileName, scope, 0];
        var upperBound = [fileName, scope, timeStamp];
        var past = IDBKeyRange.bound(lowerBound, upperBound);
        var get = store.index('byNameScopeAndTime').openKeyCursor(past);
        var close = db.close.bind(db, db);
        var del = new Promise(function(resolve, reject) {
            var deleteRequests = [];
            get.onerror = function() { reject(get.error); };
            get.onsuccess = function() {
              var cursor = get.result;
              if (!cursor) {
                Promise.all(deleteRequests)
                  .then(resolve, reject);
                return;
              }

              deleteRequests.push(new Promise(function(resolve, reject) {
                  var request = store.delete(cursor.primaryKey);
                  request.onsuccess = function() { resolve(); };
                  request.onerror = reject;
                }));

              cursor.continue();
            };
          });

        del.then(close, close);

        return del;
      });
  };
  /**
   * Send a request to the provided worker to remove all records that were
   * inserted prior to the current moment.
   *
   * @param {ServiceWorker} worker
   *
   * @returns {Promise}
   */
  ServiceWorkerRecorder.client.clear = function(worker) {
    return clientSend(worker, 'service-worker-recorder.js:clear');
  };

  /**
   * Create a new record with the provided value.
   *
   * @param {any} value
   *
   * @returns {Promise}
   */
  ServiceWorkerRecorder.worker.save = function(value) {
    var timeStamp = start + performance.now();

    return connect().then(function(db) {
        var transaction = db.transaction([storeName], 'readwrite');
        var close = db.close.bind(db);
        var put = new Promise(function(resolve, reject) {
            transaction.objectStore(storeName).put({
                timeStamp: timeStamp,
                fileName: fileName,
                scope: scope,
                value: value
              });
            transaction.onerror = reject;
            transaction.oncomplete = resolve;
          });

        put.then(close, close);

        return put;
      });
  };
  /**
   * Send a request to the provided worker to create a record with the provided
   * value.
   *
   * @param {ServiceWorker} worker
   * @param {any} value
   *
   * @returns {Promise}
   */
  ServiceWorkerRecorder.client.save = function(worker, value) {
    return clientSend(worker, 'service-worker-recorder.js:save', value);
  };

  /**
   * Read all records from the database.
   *
   * @returns {Promise<Array>}
   */
  ServiceWorkerRecorder.worker.read = function() {
    return connect().then(function(db) {
        var txn = db.transaction([storeName]);
        var lowerBound = [fileName, scope, 0];
        var upperBound = [fileName, scope, Infinity];
        var past = IDBKeyRange.bound(lowerBound, upperBound);
        var request = txn.objectStore(storeName).index('byNameScopeAndTime')
          .openCursor(past);
        var close = db.close.bind(db);
        var readAll = new Promise(function(resolve, reject) {
            var results = [];
            txn.onerror = request.onerror = reject;

            request.onsuccess = function(event) {
              var cursor = event.target.result;
              if (cursor) {
                results.push(cursor.value);
                cursor.continue();
                return;
              }
              results.sort(function(a, b) {
                  return a.timeStamp - b.timeStamp;
                });
              resolve(results.map(function(result) { return result.value; }));
            };
          });

        readAll.then(close, close);

        return readAll;
      });
  };
  /**
   * Send a request to the provided worker to read all records from the
   * database.
   *
   * @param {ServiceWorker} worker
   *
   * @returns {Promise<Array>}
   */
  ServiceWorkerRecorder.client.read = function(worker) {
    return clientSend(worker, 'service-worker-recorder.js:read');
  };

  if ('ServiceWorkerGlobalScope' in self &&
    self instanceof ServiceWorkerGlobalScope) {
    self.addEventListener('message', onMessage);
  }

  return ServiceWorkerRecorder;
}());
