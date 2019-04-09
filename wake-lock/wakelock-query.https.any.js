'use strict';

test(() => {
  const invalidTypes = [
    "invalid",
    "",
    null,
    true,
    123,
    {},
    Symbol(),
    () => {},
    self
  ];
  const lock = new WakeLock("screen");

  invalidTypes.map(invalidType => {
    assert_throws(new TypeError(), () => lock.query({ type: invalidType }));
  });
}, "'TypeError' is thrown when filter WakeLock with an invalid type");

test(() => {
  const lock1 = new WakeLock("screen");
  const lock2 = new WakeLock("screen");
  const lock3 = new WakeLock("system");
  const lock4 = new WakeLock("system");

  const lockList = lock1.query();
  assert_equals(lockList.size, 4, "Size of WakeLock instance list");
  for (let lock of lockList) {
    assert_true(lock instanceof WakeLock, "query() must have returned WakeLock instance");
  }
}, "Filter all constructed WakeLock instances");

test(() => {
  const lock1 = new WakeLock("screen");
  const lock2 = new WakeLock("screen");
  const lock3 = new WakeLock("system");
  const lock4 = new WakeLock("system");

  // query "screen" type of WakeLock
  const lockList1 = lock1.query({ type: "screen" });
  assert_equals(lockList1.size, 2, "Size of WakeLock instance list with 'screen' type");
  for (let lock of lockList1) {
    assert_true(lock instanceof WakeLock, "query() must have returned WakeLock instance");
    assert_equals(lock.type, "screen", "WakeLock type");
  }

  // query "system" type of WakeLock
  const lockList2 = lock1.query({ type: "system" });
  assert_equals(lockList2.size, 2, "Size of WakeLock instance list with 'system' type");
  for (let lock of lockList2) {
    assert_true(lock instanceof WakeLock, "query() must have returned WakeLock instance");
    assert_equals(lock.type, "system", "WakeLock type");
  }
}, "Filter constructed WakeLock instances with 'type' option");

promise_test(async t => {
  const lock1 = new WakeLock("screen");
  const lock2 = new WakeLock("screen");

  const controller = new AbortController();
  await lock1.request({ signal: controller.signal });
  assert_true(lock1.active, "lock1 must have been activated");
  assert_true(lock2.active, "lock2 must have been activated");

  // query activated WakeLock
  const lockList1 = lock1.query({ active: true });
  assert_equals(lockList1.size, 2, "Size of WakeLock instance list with activated state");
  for (let lock of lockList1) {
    assert_true(lock instanceof WakeLock, "query() must have returned WakeLock instance");
    assert_equals(lock.type, "screen", "WakeLock type");
  }

  // query inactivated WakeLock
  const lockList2 = lock1.query({ active: false });
  assert_equals(lockList2.size, 0, "Size of WakeLock instance list with activated state");

  controller.abort();
}, "Filter constructed WakeLock instances with 'active' option");

promise_test(async t => {
  const lock1 = new WakeLock("screen");
  const lock2 = new WakeLock("screen");
  const lock3 = new WakeLock("system");
  const lock4 = new WakeLock("system");

  const controller = new AbortController();
  await lock1.request({ signal: controller.signal });
  assert_true(lock1.active, "lock1 must have been activated");
  assert_true(lock2.active, "lock2 must have been activated");
  assert_false(lock3.active, "lock3 must have been activated");
  assert_false(lock4.active, "lock4 must have been activated");

  // query activated screen WakeLock
  const lockList1 = lock1.query({ type: "screen", active: true });
  assert_equals(lockList1.size, 2, "Size of activated screen WakeLock instance list");
  for (let lock of lockList1) {
    assert_true(lock instanceof WakeLock, "query() must have returned WakeLock instance");
    assert_equals(lock.type, "screen", "WakeLock type");
  }

  // query activated system WakeLock
  const lockList2 = lock1.query({ type: "system", active: true });
  assert_equals(lockList2.size, 0, "Size of activated system WakeLock instance list");

  // query inactivated screen WakeLock
  const lockList3 = lock1.query({ type: "screen", active: false });
  assert_equals(lockList3.size, 0, "Size of inactivated screen WakeLock instance list");

  // query inactivated system WakeLock
  const lockList4 = lock1.query({ type: "system", active: false });
  assert_equals(lockList4.size, 2, "Size of inactivated system WakeLock instance list");
  for (let lock of lockList4) {
    assert_true(lock instanceof WakeLock, "query() must have returned WakeLock instance");
    assert_equals(lock.type, "system", "WakeLock type");
  }

  controller.abort();
}, "Filter constructed WakeLock instances with both 'type' and active' options");

test(() => {
  const lock1 = new WakeLock("screen");
  const lock2 = new WakeLock("screen");
  const lock3 = new WakeLock("system");
  const lock4 = new WakeLock("system");

  const lockList1 = lock1.query();
  const lockList2 = lock2.query();
  const lockList3 = lock3.query();
  const lockList4 = lock4.query();

  assert_true(setEquals(lockList1, lockList2), "lockList1 must equal to lockList2");
  assert_true(setEquals(lockList2, lockList3), "lockList2 must equal to lockList3");
  assert_true(setEquals(lockList3, lockList4), "lockList3 must equal to lockList4");
}, "Each WakeLock instance's query() method should return the same WakeLock list");

function setEquals(set1, set2) {
  if (set1.size !== set2.size) return false;
  for (let i of set1) {
    if (!set2.has(i)) return false;
  }
  return true;
}
