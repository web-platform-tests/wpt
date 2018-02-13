"use strict";
// https://console.spec.whatwg.org/#formatter

const clauses = ["must throw a TypeError when applying the", "format specifier on a Symbol"];

function assertFailure(method, specifier) {
  assert_throws({name: "TypeError"}, () => {
    console[method](specifier, Symbol.for("description"));
  }, `${method}() ${clauses[0]} ${specifier} ${clauses[1]}`);
}

test(() => {
  assertFailure("log", "%i");
  assertFailure("log", "%d");
  assertFailure("log", "%f");
}, "console.log() throws exceptions when applying non-string format specifiers to Symbols");

test(() => {
  assertFailure("dirxml", "%i");
  assertFailure("dirxml", "%d");
  assertFailure("dirxml", "%f");
}, "console.dirxml() throws exceptions when applying non-string format specifiers to Symbols");

test(() => {
  assertFailure("trace", "%i");
  assertFailure("trace", "%d");
  assertFailure("trace", "%f");
}, "console.trace() throws exceptions when applying non-string format specifiers to Symbols");

test(() => {
  assertFailure("group", "%i");
  assertFailure("group", "%d");
  assertFailure("group", "%f");
}, "console.group() throws exceptions when applying non-string format specifiers to Symbols");

test(() => {
  assertFailure("groupCollapsed", "%i");
  assertFailure("groupCollapsed", "%d");
  assertFailure("groupCollapsed", "%f");
}, "console.groupCollapsed() throws exceptions when applying non-string format specifiers to Symbols");
