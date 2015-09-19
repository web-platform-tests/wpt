onmessage = function(event) {
  var file = event.data;
  readFile(file);
}

function readFile(file) {
    var reader = new FileReader();
    reader.onload = function (event) {
      var content = reader.result;

     var message = {
                      "name": file.name,
                      "content": content,
                      "lastModified": file.lastModified
                    };
      postMessage(message);
    };

    reader.onerror = function(event) {
      postMessage(event.error.message);
    }
    reader.readAsText(file);
}
