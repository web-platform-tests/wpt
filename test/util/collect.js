"use strict";

const wp = require("../../dist/webidl2");
const pth = require("path");
const fs = require("fs");
const jdp = require("jsondiffpatch");

/**
 * Collects test items from the specified directory
 * @param {string} base
 */
function* collect(base, { expectError, raw } = {}) {
  base = pth.join(__dirname, "..", base);
  const dir = pth.join(base, "idl");
  const idls = fs.readdirSync(dir)
    .filter(it => (/\.widl$/).test(it))
    .map(it => pth.join(dir, it));

  for (const path of idls) {
    try {
      const text = fs.readFileSync(path, "utf8");
      const ast = wp.parse(text);
      const validation = wp.validate(ast);
      if (validation) {
        yield new TestItem({ text, ast, path, validation, raw });
      } else {
        yield new TestItem({ text, ast, path, raw });
      }
    }
    catch (error) {
      if (expectError) {
        yield new TestItem({ path, error, raw });
      }
      else {
        throw error;
      }
    }
  }
}


class TestItem {
  constructor({ text, ast, path, error, validation, raw }) {
    this.text = text;
    this.ast = ast;
    this.path = path;
    this.error = error;
    this.validation = validation;
    const fileExtension = raw ? ".txt" : ".json";
    this.baselinePath = pth.join(
      pth.dirname(path),
      "../baseline",
      pth.basename(path).replace(".widl", fileExtension)
    );
  }

  readJSON() {
    return JSON.parse(this.readText());
  }

  readText() {
    return fs.readFileSync(this.baselinePath, "utf8");
  }

  diff(target = this.readJSON()) {
    return jdp.diff(target, this.ast);
  }
}

module.exports.collect = collect;
