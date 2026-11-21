// META: title=Observable sharing proposal: conversion and independent observations
// META: global=window,dedicatedworker
// META: spec=https://github.com/WICG/observable/issues/221

for (const name of ["Observable", "SharedObservable"]) {
  test(() => {
    let starts = 0;
    const source = new self[name](() => ++starts);
    assert_equals(Observable.from(source), source);
    assert_equals(starts, 0);
  }, `Observable.from() preserves ${name} identity without observing`);
}

test(() => {
  let iterators = 0;
  const source = Observable.from({
    *[Symbol.iterator]() { ++iterators; yield 1; yield 2; },
  });
  const a = [];
  const b = [];
  assert_equals(iterators, 0);
  source.subscribe(v => a.push(v));
  source.subscribe(v => b.push(v));
  assert_equals(iterators, 2);
  assert_array_equals(a, [1, 2]);
  assert_array_equals(b, [1, 2]);
  assert_not_equals(source.share(), source);
}, "Iterable conversion is lazy and obtains an iterator for each observation");

promise_test(async () => {
  let iterators = 0;
  const source = Observable.from({
    async *[Symbol.asyncIterator]() { ++iterators; yield 1; yield 2; },
  });
  const a = [];
  const b = [];
  assert_equals(iterators, 0);
  await Promise.all([a, b].map(values => new Promise((resolve, reject) => {
    source.subscribe({next: v => values.push(v), complete: resolve, error: reject});
  })));
  assert_equals(iterators, 2);
  assert_array_equals(a, [1, 2]);
  assert_array_equals(b, [1, 2]);
}, "Async iterable conversion has independent iterators for overlapping observations");

promise_test(async () => {
  let executions = 0;
  const value = {};
  const promise = new Promise(resolve => { ++executions; resolve(value); });
  const source = Observable.from(promise);
  const log = [];
  for (let i = 0; i < 2; ++i) {
    await new Promise((resolve, reject) => source.subscribe({
      next: v => log.push(v), complete: resolve, error: reject,
    }));
  }
  assert_equals(executions, 1);
  assert_array_equals(log, [value, value]);
}, "Reobserving an existing Promise does not recreate the operation that produced it");

test(() => {
  const iterator = [1, 2][Symbol.iterator]();
  const source = Observable.from(iterator);
  const a = [];
  const b = [];
  source.subscribe(v => a.push(v));
  source.subscribe(v => b.push(v));
  assert_array_equals(a, [1, 2]);
  assert_array_equals(b, []);
}, "Reobserving an existing iterator does not rewind it");
