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

var generated_name = "";
function generate_unique_name (prefix) {
    prefix = prefix || "";
    var key = "KJHFcjqvhk12e";
    var name= prefix + key.substr((Math.random()*(key.length-3)), 3) + (new Date()).getTime();
    if( generated_name.indexOf(name) !== -1 ) {
        return generate_unique_name(prefix);
    } else {
        generated_name += "|" + name;
        return name;
    }
}


/*******************************************/

