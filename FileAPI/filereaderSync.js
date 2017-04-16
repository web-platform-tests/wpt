addEventListener('message', MessageHandler, false);

function MessageHandler (event) {
  try {
    var readerSync = new FileReaderSync();
    var blob = new Blob(["test"]);
    if (event.data == "fileReaderSync") {
      postMessage(readerSync instanceof FileReaderSync);
    } else if(event.data == "fileReaderSync_readAsText") {
      var text = readerSync.readAsText(blob);
      postMessage(text);
    } else if(event.data == "fileReaderSync_readAsDataURL") {
      var data = readerSync.readAsDataURL(blob);
      postMessage(data);
    } else if(event.data == "fileReaderSync_readAsArrayBuffer") {
      var data = readerSync.readAsArrayBuffer(blob);
      postMessage(data);
    } else {
      postMessage("There is a wrong");
    }
  } catch (e) {
    postMessage("Error:" + e.message);
  }
}
