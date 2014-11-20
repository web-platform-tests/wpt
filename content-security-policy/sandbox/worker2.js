onmessage = function (oEvent) {  

  function disambig(inString) {
     if(inString === null) { return 'null'; }
     if(inString === undefined) { return 'undefined'; }
     return inString;
  }
    
  postMessage({context: 'httpSubWorker', 
               locationOrigin: disambig(location.origin),
               eventOrigin: disambig(oEvent.origin),
               urlOrigin: disambig(oEvent.data)
              });      
}