// META: title=set() removes key from internal map on NotAllowedError

/*
 * If calling the `set()` method results in a JSON serialization size greater than the configured buffer length, the key must be removed from the internal map before throwing the exception.
 */

promise_test(async t => {
  // Step 1. Call initialize(16).
  await window.crashReport.initialize(16);

  // Step 2. Call set('a', 'a') (takes 9 bytes: {"a":"a"}).
  window.crashReport.set('a', 'a');

  // Step 3. Attempt to call set('b', 'b') and catch the NotAllowedError.
  // {"a":"a","b":"b"} is 17 bytes, which exceeds the 16 byte limit.
  assert_throws_dom("NotAllowedError", () => {
    window.crashReport.set('b', 'b');
  });

  // Step 4. Call set('c', '') (takes 8 bytes: "c":"" -> {"a":"a","c":""} is 16 bytes).
  // The final set('c', '') succeeds because 'b' was removed, leaving exactly enough room for 'c' (total 16 bytes).
  window.crashReport.set('c', '');
}, "set() removes key from internal map on NotAllowedError");