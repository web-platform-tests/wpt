"use strict";

importScripts("/resources/testharness.js");
importScripts("/resources/WebIDLParser.js", "/resources/idlharness.js");

var objects = {
  WorkerNavigator: ['self.navigator'],
  WebSocket: ['new WebSocket("ws://foo")'],
  CloseEvent: ['new CloseEvent("close")'],
  Worker: [],
  MessageEvent: ['new MessageEvent("message", { data: 5 })'],
  DedicatedWorkerGlobalScope: ['self'],
};

test_idl({
  tested_urls: ["/interfaces/html.idl"],
  untested_urls: [
    "/interfaces/dom.idl",
    "/interfaces/cssom.idl",
    "/interfaces/touchevents.idl",
    "/interfaces/uievents.idl",
  ],
  untested_code: "interface SVGElement : Element {};",
  objects,
  prevent_multiple_testing: ["HTMLElement"],
});

done();
