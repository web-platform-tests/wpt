// NOTES:
//  - the errors actually still need to be reviewed to check that they
//    are fully correct interpretations of the IDLs

"use strict";

const { collect } = require("./util/collect");
const { parse } = require("..");
const expect = require("expect");

describe("Parses all of the invalid IDLs to check that they blow up correctly", () => {
  for (const test of collect("invalid", { expectError: true, raw: true })) {
    it(`should produce the right error for ${test.path}`, () => {
      const err = test.readText();
      if (test.error) {
        expect(test.error.message + "\n").toEqual(err);
      } else if (test.validation) {
        expect(test.validation.join("\n") + "\n").toEqual(err);
      } else {
        throw new Error("This test unexpectedly had no error");
      }
    });
  }
});

describe("Error object structure", () => {
  it("should named WebIDLParseError", () => {
    try {
      parse("typedef unrestricted\n\n\n3.14 X;");
      throw new Error("Shouldn't reach here");
    } catch ({ name }) {
      expect(name).toBe("WebIDLParseError");
    }
  });

  it("should contain error line field", () => {
    try {
      parse("typedef unrestricted\n\n\n3.14 X;");
      throw new Error("Shouldn't reach here");
    } catch ({ line }) {
      expect(line).toBe(4);
    }
  });

  it("should contain input field", () => {
    try {
      parse("couldn't read any token");
      throw new Error("Shouldn't reach here");
    } catch ({ input }) {
      expect(input).toBe("couldn't read any");
    }
  });

  it("should contain tokens field", () => {
    try {
      parse("cannot find any valid definitions");
      throw new Error("Shouldn't reach here");
    } catch ({ tokens }) {
      expect(tokens.length).toBe(5);
      expect(tokens[0].type).toBe("identifier");
      expect(tokens[0].value).toBe("cannot");
    }
  });
});
