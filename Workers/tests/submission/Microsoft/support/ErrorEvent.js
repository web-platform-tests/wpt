onmessage = function(evt)
{
    throw(evt.data);
}

onerror = function(err)
{
    postMessage( {event: err.toString(), type: err.type, message: err.message, filename: err.filename, lineno: err.lineno} );
}