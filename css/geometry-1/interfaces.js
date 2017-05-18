"use strict";

var idlArray = new IdlArray();

function doTest(idl) {
  idlArray.add_idls(idl);
  idlArray.add_objects({
    DOMPoint: ["new DOMPoint()"],
    DOMRect: ["new DOMRect()"],
    DOMMatrix: ["new DOMMatrix()"],
  });
  idlArray.test();
  done();
}

promise_test(function() {
  return fetch("/interfaces/geometry.idl").then(response => response.text())
                                          .then(doTest);
}, "Test driver");
