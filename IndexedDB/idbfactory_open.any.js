// META: title=IDBFactory.open()
// META: global=window,worker
// META: script=resources/support.js
// @author Microsoft <https://www.microsoft.com>
// @author Odin H�rthe Omdal <mailto:odinho@opera.com>

'use strict';


/* Valid */

function should_work(val, expected_version) {
    let name = format_value(val);
    let dbname = 'test-db-does-not-exist';
    async_test(function (t) {
        indexedDB.deleteDatabase(dbname);
        let rq = indexedDB.open(dbname, val);
        console.log("Opening" + dbname + val)
        rq.onupgradeneeded = t.step_func(function () {
            console.log("Upgrade for"  + dbname + val);
            let db = rq.result;
            assert_equals(db.version, expected_version, 'version');
            rq.transaction.abort();
        });
        rq.onsuccess = t.unreached_func("open should fail");
        rq.onerror = t.step_func(function () {
            console.log("DOne for"  + dbname + val);
            t.done()
        });
    }, "Calling open() with version argument " + name + " should not throw.");
}

should_work(1.5, 1)
should_work(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)  // 0x20000000000000 - 1
should_work(undefined, 1);
