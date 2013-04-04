self.addEventListener('message', MessageHandler, false);

function MessageHandler(e)
{
    if( self.msIndexedDB ||
        self.webkitIndexedDB ||
        self.mozIndexedDB) 
    {
        self.postMessage(true);
    } else {
        self.postMessage(false);
    }
}