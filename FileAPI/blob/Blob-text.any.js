// META: global=window,worker
// META: title=Blob text() method tests

"use strict";

promise_test(async () => {
  const blob = new Blob(["HELLO"]);
  const result = await blob.text();
  assert_equals(result, "HELLO");
}, "Blob.text() returns correct string");

promise_test(async () => {
  const blob = new Blob([]);
  const result = await blob.text();
  assert_equals(result, "");
}, "Blob.text() returns empty string for empty blob");
