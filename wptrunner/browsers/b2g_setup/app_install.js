const Cu = Components.utils;
const {devtools} = Cu.import("resource://gre/modules/devtools/Loader.jsm", {});
const {require} = devtools;
const {installPackaged} = require("devtools/app-actor-front");
let { DebuggerServer } = Cu.import("resource://gre/modules/devtools/dbg-server.jsm", {});
let { DebuggerClient } = Cu.import("resource://gre/modules/devtools/dbg-client.jsm", {});

let gClient, gActor;
let gAppId = "certtest-app";

let onDone = function () {
  installPackaged(gClient, gActor, "/data/local/certtest_app.zip", gAppId)
    .then(function ({ appId }) {
      gClient.close();
      marionetteScriptFinished("finished");
    }, function (e) {
      gClient.close();
      marionetteScriptFinished("Failed install uploaded packaged app: " + e.error + ": " + e.message);
    });
};

let connect = function(onDone) {
  // Initialize a loopback remote protocol connection
  if (!DebuggerServer.initialized) {
    DebuggerServer.init(function () { return true; });
    // We need to register browser actors to have `listTabs` working
    // and also have a root actor
    DebuggerServer.addBrowserActors();
  }

  // Setup the debugger client
  gClient = new DebuggerClient(DebuggerServer.connectPipe());
  gClient.connect(function onConnect() {
    gClient.listTabs(function onListTabs(aResponse) {
      gActor = aResponse.webappsActor;
      onDone();
    });
  });
};

connect(onDone);
