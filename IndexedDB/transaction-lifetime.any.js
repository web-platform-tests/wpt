// META: title=Event order when opening a second database when one connection is open already
// META: global=window,worker
// META: script=resources/support.js

'use strict';

async function setupDatabase(t, dbname, version) {
    let db;
    indexedDB.deleteDatabase(dbname);
    const openrq = indexedDB.open(dbname, version);
    const eventWatcher = new EventWatcher(t, openrq, ["upgradeneeded", "success"]);

    await eventWatcher.wait_for('upgradeneeded').then(function (e) {
        e.target.result.createObjectStore('store');
    });

    await eventWatcher.wait_for('success').then(function (e) {
        db = e.target.result;
    });

    return db;
}

promise_test(async t => {
    const dbname = location + '-' + t.name;
    const version = 3;
    const db = await setupDatabase(t, dbname, version);
    let db2;

    t.add_cleanup(() => {
        if (db2) db2.close();
        indexedDB.deleteDatabase(dbname);
    });

    const dbWatcher = new EventWatcher(t, db, ["versionchange"]);
    const dbWait = dbWatcher.wait_for('versionchange');
    const openrq2 = indexedDB.open(dbname, version + 1);
    const eventWatcher2 = new EventWatcher(t, openrq2, ["upgradeneeded", "success"]);
    await dbWait.then(function (e) {
        assert_equals(e.oldVersion, version, "old version");
        assert_equals(e.newVersion, version + 1, "new version");
        db.close();
    });

    await eventWatcher2.wait_for('upgradeneeded');

    return eventWatcher2.wait_for('success').then(function (e) {
        db2 = e.target.result;
    });
}, "No Blocked event");

promise_test(async t => {
    const dbname = location + '-' + t.name;
    const version = 3;
    const db = await setupDatabase(t, dbname, version);
    let db2;

    t.add_cleanup(() => {
        if (db2) db2.close();
        indexedDB.deleteDatabase(dbname);
    });

    const dbWatcher = new EventWatcher(t, db, ["versionchange"]);
    const dbWait = dbWatcher.wait_for('versionchange');
    const openrq2 = indexedDB.open(dbname, version + 1);
    const eventWatcher2 = new EventWatcher(t, openrq2, ["blocked", "upgradeneeded", "success"]);

    await dbWait.then(function (e) {
        assert_equals(e.oldVersion, version, "old version");
        assert_equals(e.newVersion, version + 1, "new version");
        // Don't close the first connection here so that a blocked event is fired on openrq2
    });

    await eventWatcher2.wait_for('blocked').then(function (e) {
        db.close();
    });

    await eventWatcher2.wait_for('upgradeneeded');

    return eventWatcher2.wait_for('success').then(function (e) {
        db2 = e.target.result;
    });
}, "Blocked event");
