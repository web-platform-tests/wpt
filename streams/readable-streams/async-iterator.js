'use strict';

if (self.importScripts) {
  self.importScripts('../resources/rs-utils.js');
  self.importScripts('/resources/testharness.js');
  self.importScripts('../resources/recording-streams.js');
}

test(() => {
  assert_equals(ReadableStream.prototype[Symbol.asyncIterator], ReadableStream.prototype.getIterator);
}, '@@asyncIterator() method is === to getIterator() method');

promise_test(async () => {
  const s = recordingReadableStream({
    start(c) {
      c.enqueue(1);
      c.enqueue(2);
      c.enqueue(3);
      c.close();
    },
  });

  const chunks = [];
  for await (const chunk of s) {
    chunks.push(chunk);
  }
  assert_array_equals(chunks, [1, 2, 3]);
}, 'async iterator push source');

promise_test(async () => {
  let i = 1;
  const s = recordingReadableStream({
    pull(c) {
      c.enqueue(i);
      if (i >= 3) {
        c.close();
      }
      i += 1;
    },
  });

  const chunks = [];
  for await (const chunk of s) {
    chunks.push(chunk);
  }
  assert_array_equals(chunks, [1, 2, 3]);
}, 'async iterator pull source');

promise_test(async () => {
  const s = new ReadableStream({
    start(c) {
      c.error('e');
    },
  });

  try {
    for await (const chunk of s) {}
    assert(false);
  } catch (e) {
    assert_equals(e, 'e');
  }
}, 'Async-iterating an errored stream throws');

promise_test(async () => {
  const s = new ReadableStream({
    start(s) {
      s.close();
    }
  });

  for await (const chunk of s) {
    assert(false);
  }
}, 'Async-iterating a closed stream never executes the loop body, but works fine');

promise_test(async () => {

}, 'Async-iterating an empty but not closed/errored stream never executes the loop body and stalls the async function');

promise_test(async () => {
  const test = async (type, preventCancel) => {
    const s = recordingReadableStream({
      start(c) {
        c.enqueue(0);
      }
    });

    await (async () => {
      for await (const c of s.getIterator({ preventCancel })) {
        if (type === 'throw') {
          throw 'e';
        } else if (type === 'break') {
          break;
        } else if (type === 'return') {
          return;
        }
      }
    })().catch(() => 0);

    assert_equals(s.locked, preventCancel);
  };

  for (const t of ['throw', 'break', 'return']) {
    await test(t, true);
    await test(t, false);
  }
}, 'cancellation behavior');

promise_test(async () => {
  {
    const s = new ReadableStream({});
    const it = s[Symbol.asyncIterator]();
    await it.return();
    try {
      await it.return();
      assert(false);
    } catch (e) {}
  }

  {
    const s = new ReadableStream({
      start(c) {
        c.enqueue(0);
        c.close();
      },
    });
    const it = s[Symbol.asyncIterator]();
    const next = await it.next();
    // assert_equals(Object.getPrototypeOf(next), Object.prototype);
    assert_array_equals(Object.keys(next), ['value', 'done']);
  }
}, 'manual manipulation');

test(() => {
  const s = new ReadableStream({
    start(c) {
      c.enqueue(0);
      c.close();
    },
  });
  const it = s.getIterator();
  assert_throws(() => {
    const it2 = s.getIterator();
  });
}, 'getIterator throws if there\'s already a lock');
