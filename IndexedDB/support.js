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