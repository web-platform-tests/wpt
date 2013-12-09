var databaseName = "database";
var databaseVersion = 1;

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

function assert_open_request_error(event) {
    assert_unreached("Open request error: " + event.target.error.name); 
}

function assert_deleteDatabase_request_error(event) {
    assert_unreached("Delete database request error: " + event.target.error.name); 
}

function assert_database_error(event) {
    assert_unreached("Database error: " + event.target.error.name);
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

// modified version of support.js’ createdb function,
// the returned DB object has a `setTest(t)` method which
// change the 'test' object used for fails reports, and return
// the DB object (for chained calls)
// Author: Baptiste Fontaine (batifon@yahoo.fr, bfn on IRC)
function createdb_for_multiple_tests(dbname, version) {
    var rq_open,
        fake_open = {},
        test = null,
        dbname = (dbname ? dbname : "testdb-" + new Date().getTime() + Math.random() );

    if (version)
        rq_open = window.indexedDB.open(dbname, version);
    else
        rq_open = window.indexedDB.open(dbname);

    function auto_fail(evt, current_test) {
        /* Fail handlers, if we haven't set on/whatever/, don't
         * expect to get event whatever. */
        rq_open.manually_handled = {}

        rq_open.addEventListener(evt,

            function(e) {

                if (current_test !== test) {
                    return;
                }

                test.step(function() {
                    if (!rq_open.manually_handled[evt]) {
                        assert_unreached("unexpected open." + evt + " event");
                    }

                    if (e.target.result + "" == "[object IDBDatabase]" && !this.db) {
                        this.db = e.target.result;

                        this.db.onerror = fail(test, "unexpected db.error");
                        this.db.onabort = fail(test, "unexpected db.abort");
                        this.db.onversionchange = fail(test, "unexpected db.versionchange");
                    }
                });

            }

        )
        rq_open.__defineSetter__("on" + evt, function(h) {
            rq_open.manually_handled[evt] = true
            if (!h)
                rq_open.addEventListener(evt, function() {})
            else
                rq_open.addEventListener(evt, test.step_func(h))
        })
    }

    // add a .setTest method to the DB object
    Object.defineProperty(rq_open, 'setTest', {
        enumerable : false,
        value      : function(t) {

            test = t;

            auto_fail("upgradeneeded", test);
            auto_fail("success", test);
            auto_fail("blocked", test);
            auto_fail("error", test);
            
            return this;
        }
    });

    return rq_open
}
