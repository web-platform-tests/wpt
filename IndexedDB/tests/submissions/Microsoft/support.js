var databaseName = "database";

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

function PassTest()
{
    if (db)
    {
        db.close();
        db = null;
    }
    t.step(function() { assert_true(true); } );
    t.done();
}

function FailTest()
{
    if (db)
    {
        db.close();
        db = null;
    }
    t.step(function() { assert_true(false); } );
    t.done();
}

function Initialize()
{
    try
    {
        if (window.indexedDB.deleteDatabase)
        {
            var rqDelete = window.indexedDB.deleteDatabase(databaseName);
            rqDelete.onsuccess = RunTest;
        }
        else
        {
            var rqOpen = window.indexedDB.open(databaseName);
            rqOpen.onsuccess = function(event)
            {
                var database = event.target.result;
                var rqVersionChange = database.setVersion("1")
                rqVersionChange.onsuccess = function(event)
                {
                    while (0 < database.objectStoreNames.length)
                    {
                        database.deleteObjectStore(database.objectStoreNames[0]);
                    }
                    this.transaction.oncomplete = RunTest;
                };
                rqVersionChange.onerror = function(event)
                {
                    FailTest();
                }
                database.close();
            };
        }
    }
    catch (ex)
    {
        FailTest();
    }
}