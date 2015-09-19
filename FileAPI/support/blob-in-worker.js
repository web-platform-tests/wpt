onmessage = function(event) {
  readBlob(event.data);
}

function readBlob(data) {
    var blob = new Blob([data], {type: "text/plain"});
    
    var reader = new FileReader();
    reader.onload = function (event) {
      var content = reader.result;
      postMessage(content);
    };
    
    reader.onerror = function(event) {
      postMessage(event.error.message);
    }
    reader.readAsText(blob);
}
