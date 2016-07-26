"use strict";

importScripts("/resources/testharness.js");
importScripts("/resources/WebIDLParser.js", "/resources/idlharness.js");

var request = new XMLHttpRequest();
request.open("GET", "interfaces.worker.idl");
request.send();
request.onload = function() {
  var idlArray = new IdlArray();
  var idls = request.responseText;

  idlArray.add_untested_idls("interface WorkerGlobalScope {};");
  idlArray.add_untested_idls("interface WorkerNavigator {};");
  idlArray.add_untested_idls("interface Event {};");
  idlArray.add_untested_idls("interface EventTarget {};");

  idlArray.add_idls(idls);

  idlArray.add_objects({
    Navigator: ['navigator'],
    NetworkInformation: ['navigator.connection']
  });
  idlArray.test();
  done();
};
