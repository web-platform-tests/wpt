"use strict";
// https://console.spec.whatwg.org/#formatter

const clauses = ["must throw a TypeError when applying the", "format specifier on a Symbol"];

function errorTag(subs, clause1, clause2) {
  return subs[0] + clause1 + subs[1] + clause2;
}

test(() => {
  assert_throws({name: "TypeError"}, () => {
    console.log("%i", Symbol.for("description"));
  }, errorTag`log() ${clauses[0]} %i ${clauses[1]}`);

  assert_throws({name: "TypeError"}, () => {
    console.log("%d", Symbol.for("description"));
  }, errorTag`log() ${clauses[0]} %d ${clauses[1]}`);

  assert_throws({name: "TypeError"}, () => {
    console.log("%f", Symbol.for("description"));
  }, errorTag`log() ${clauses[0]} %f ${clauses[1]}`);

}, "console.log() throws exceptions when applying non-string format specifiers to Symbols");

test(() => {
  assert_throws({name: "TypeError"}, () => {
    console.dir("%i", Symbol.for("description"));
  }, errorTag`dir() ${clauses[0]} %i ${clauses[1]}`);

  assert_throws({name: "TypeError"}, () => {
    console.dir("%d", Symbol.for("description"));
  }, errorTag`dir() ${clauses[0]} %d ${clauses[1]}`);

  assert_throws({name: "TypeError"}, () => {
    console.dir("%f", Symbol.for("description"));
  }, errorTag`dir() ${clauses[0]} %f ${clauses[1]}`);

}, "console.dir() throws exceptions when applying non-string format specifiers to Symbols");

test(() => {
  assert_throws({name: "TypeError"}, () => {
    console.dirxml("%i", Symbol.for("description"));
  }, errorTag`dirxml() ${clauses[0]} %i ${clauses[1]}`);

  assert_throws({name: "TypeError"}, () => {
    console.dirxml("%d", Symbol.for("description"));
  }, errorTag`dirxml() ${clauses[0]} %d ${clauses[1]}`);

  assert_throws({name: "TypeError"}, () => {
    console.dirxml("%f", Symbol.for("description"));
  }, errorTag`dirxml() ${clauses[0]} %f ${clauses[1]}`);

}, "console.dirxml() throws exceptions when applying non-string format specifiers to Symbols");
