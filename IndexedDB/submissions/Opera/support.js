/*_real_assert_throws = assert_throws;
function assert_throws(d, func, desc) {
    try {
        func();
    } catch(e) {
        return true;
        name = RegExp(d.name.replace("Error", ""), "i");
        if(name.test(e.name))
            return true;
        else
            assert_unreached("Expected: " + d.name + ", got: " + e.name);
    }
//    _real_assert_throws(d, function() {}, desc);
    assert_unreached("Didn't throw!");
}*/

if (!window.indexedDB)
{
    if (window.msIndexedDB)
    {
        window.indexedDB = window.msIndexedDB;
    }
    else if (window.mozIndexedDB)
    {
        window.indexedDB = window.mozIndexedDB;
    }
    else if (window.webkitIndexedDB)
    {
        window.indexedDB        = webkitIndexedDB;
        IDBCursor               = webkitIDBCursor;
        IDBDatabaseException    = webkitIDBDatabaseException;
        IDBIndex                = webkitIDBIndex;
        IDBObjectStore          = webkitIDBObjectStore;
        IDBRequest              = webkitIDBRequest;
        IDBKeyRange             = webkitIDBKeyRange;
        IDBTransaction          = webkitIDBTransaction;
    }
}

/* Delete created databases
 *
 * Go through each finished test, see if it has an associated database. Close
 * that and delete the database. */
add_completion_callback(function(tests)
{
    for (var i in tests)
    {
        if(tests[i].db)
        {
            tests[i].db.close();
            window.indexedDB.deleteDatabase(tests[i].db.name);
        }
    }
});

function createdb(test, dbname, version)
{
    var rq_open,
      fake_open = {},
      dbname = (dbname ? dbname : "testdb-" + new Date().getTime() + Math.random() );

    // Stupid Firefox bug
    if (version)
        rq_open = window.indexedDB.open(dbname, version);
    else
        rq_open = window.indexedDB.open(dbname);

    function auto_fail(evt) {
        /* Fail handlers, if we haven't set on/whatever/, don't
         * expect to get event whatever. */
        rq_open.manually_handled = {}

        rq_open.addEventListener(evt,
            test.step_func(function(e) {
                if (!rq_open.manually_handled[evt])
                    assert_unreached("unexpected open." + evt + " event")

                if (e.target.result + "" == "[object IDBDatabase]" && !this.db)
                {
                    this.db = e.target.result;

                    this.db.onerror = fail(test, "unexpected db.error");
                    this.db.onabort = fail(test, "unexpected db.abort");
                    this.db.onversionchange = fail(test, "unexpected db.versionchange");
                }
            })
        )
        rq_open.__defineSetter__("on" + evt, function(h) {
            rq_open.manually_handled[evt] = true
            if (!h)
                rq_open.addEventListener(evt, function() {})
            else
                rq_open.addEventListener(evt, test.step_func(h))
        })
    }

    auto_fail("upgradeneeded")
    auto_fail("success")
    auto_fail("blocked")
    auto_fail("error")

    return rq_open
}

function fail(test, desc) {
    return test.step_func(function(e) {
        console.log(desc, e);

        if (e && e.message && e.target.error)
            assert_unreached(desc + " (" + e.target.error.name + ": " + e.message + ")");
        else if (e && e.message)
            assert_unreached(desc + " (" + e.message + ")");
        else if (e && e.target.error)
            assert_unreached(desc + " (" + e.target.error.name + ")");
        else
            assert_unreached(desc);
    });
}


// IE tests require some of this
databaseName = "legacy_tests"
databaseVersion = 1


function assert_open_request_error(event) {
    assert_unreached("Open request error: " + event.target.errorCode);
}

function assert_deleteDatabase_request_error(event) {
    assert_unreached("Delete database request error: " + event.target.errorCode);
}

function assert_database_error(event) {
    assert_unreached("Database error, error code: " + event.target.errorCode);
}

function assert_unexpected_success() {
    assert_unreached("Unexpected success event fired.");
}

function assert_unexpected_upgradeneeded() {
    assert_unreached("Unexpected upgradeneeded event fired.");
}

function assert_expected_exception() {
    assert_unreached("Expected exception did not throw.");
}

function assert_cursor_exists(cursor) {
    assert_not_equals(cursor, null, "Cursor does not exist.");
}

function assert_unexpected_complete() {
    assert_unreached("Unexpected complete event fired.");
}
