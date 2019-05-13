"use strict";

const { collect } = require("./util/collect");
const expect = require("expect");

describe("Parses all of the IDLs to produce the correct ASTs", () => {
  for (const test of collect("syntax")) {
    it(`should produce the same AST for ${test.path}`, () => {
      expect(test.diff()).toBeFalsy();
    });
  }
});
