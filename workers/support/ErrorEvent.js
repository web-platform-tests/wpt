onmessage = function(evt)
{
    throw(new Error(evt.data));
}

onerror = function(message, location, line, col)
{
    postMessage( {"message": message, "filename": location, "lineno": line, "colno": col} );
    return false;
}
