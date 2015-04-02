// Testing importScripts()
function log(w) { this.postMessage(w) }
function f() { log("FAIL") }
function p() { log("PASS") }

["js.py", "js.py?type=", "js.py?type=x", "js.py?type=x/x"].forEach(function(url) {
  try {
    importScripts(url)
  } catch(e) {
    (e.name == "NetworkError") ? p() : f()
  }

})
importScripts("js.py?type=text/javascript&outcome=p")
importScripts("js.py?type=text/ecmascript&outcome=p")
log("END")
