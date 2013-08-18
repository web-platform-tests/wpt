var readerSync = new FileReaderSync();
var blob = new Blob(["Test FileReaderSync"]);

//Check the constructor
postMessage({type: "constructor", content: 'readAsText' in readerSync || 'readAsArrayBuffer' in readerSync || 'readAsDataURL' in readerSync});

//Check the readAsArrayBuffer method
var arraybuffer = readerSync.readAsArrayBuffer(blob);
postMessage({type: "arraybuffer", content: arraybuffer}, [arraybuffer]);

//Check the readAstext method
postMessage({type: "text", content: readerSync.readAsText(blob)});
postMessage({type: "text_utf16", content: readerSync.readAsText(blob, "utf-16")});

//Check the readAsDataURL method
postMessage({type: "dataurl", content: readerSync.readAsDataURL(blob)});
