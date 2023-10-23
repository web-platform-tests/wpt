// META: title=StorageManager: estimate()

promise_test(function(t) {
    const large_value = new Uint8Array(1e6);
    const dbname = `db-${location}-${t.name}`;
    let db, before, after;

    indexedDB.deleteDatabase(dbname);
    return new Promise((resolve, reject) => {
            const open = indexedDB.open(dbname);
            open.onerror = () => { reject(open.error); };
            open.onupgradeneeded = () => {
                const connection = open.result;
                connection.createObjectStore('store');
            };
            open.onsuccess = () => {
                const connection = open.result;
                t.add_cleanup(() => {
                    connection.close();
                    indexedDB.deleteDatabase(dbname);
                });
                resolve(connection);
            };
        })
        .then(connection => {
            db = connection;
            return navigator.storage.estimate();
        })
        .then(estimate => {
            before = estimate.usage;
            return new Promise((resolve, reject) => {
                const tx = db.transaction('store', 'readwrite', { durability: 'relaxed'});
                tx.objectStore('store').put(large_value, 'key');
                tx.onabort = () => { reject(tx.error); };
                tx.oncomplete = () => { resolve(); };
            });
        })
        .then(() => {
            return navigator.storage.estimate();
        })
        .then(estimate => {
            after = estimate.usage;
            assert_greater_than(after, before,
                                'estimated usage should increase');
        });
}, 'estimate() shows usage increase after 1MB IndexedDB record is stored');
