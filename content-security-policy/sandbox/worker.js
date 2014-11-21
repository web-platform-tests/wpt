onmessage = function (oEvent) {
    
  var worker2href = (location.href.substring(0, location.href.lastIndexOf('/')+1) + 'worker2.js');

  //console.log('httpWorker received event from origin: ' + oEvent.origin);
  //console.log(location.href);    
  //console.log(worker2href);    
    
  
  var worker2URL = worker2href;
    
  try {
      worker2URL = new URL(worker2href);    
  } catch(e) {}
    
  function disambig(inString) {
     if(inString === null) { return 'null'; }
     if(inString === undefined) { return 'undefined'; }
     return inString;
  }
    
  postMessage({'context': 'httpWorker', 
               'locationOrigin': disambig(location.origin),
               'eventOrigin': disambig(oEvent.origin)});
    
   try {
        //console.log(new URL(worker2URL).origin);
        var subworker = new Worker(worker2URL);
        subworker.onmessage = function(oEvent) {
                postMessage(oEvent.data);
        }
        subworker.postMessage(typeof worker2URL == 'string' ? 'N/A' : disambig(worker2URL.origin));
   } catch(e) {
       var errStr = e.name + ": " + e.message;
       postMessage({
           context: 'httpSubWorker',
           locationOrigin: errStr,
           eventOrigin: errStr,
           urlOrigin: disambig(worker2URL.origin)
        });
   }
};