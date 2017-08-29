// META: script=/resources/WebIDLParser.js
// META: script=/resources/idlharness.js

"use strict";

if (self.importScripts) {
    importScripts("/resources/testharness.js");
    importScripts("/resources/WebIDLParser.js", "/resources/idlharness.js");
}

// https://w3c.github.io/payment-handler/

promise_test(function() {
    return fetch("/interfaces/payment-handler.idl")
        .then(response => response.text())
        .then(text => {
            var idlArray = new IdlArray();
            idlArray.add_idls(text);
            idlArray.test();
            done();
        });
}, "Payment handler interfaces.");
