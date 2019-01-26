// META: global=worker,jsshell
// META: script=../resources/rs-utils.js
// META: script=../resources/recording-streams.js
'use strict';

test(() => {
  assert_equals(ReadableStream.prototype[Symbol.asyncIterator], ReadableStream.prototype.getIterator);
}, '@@asyncIterator() method is === to getIterator() method');

promise_test(async () => {
  const s = new ReadableStream({
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
}, 'Async-iterating a push source');

promise_test(async () => {
  let i = 1;
  const s = new ReadableStream({
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
}, 'Async-iterating a pull source');

promise_test(async () => {
  const s = new ReadableStream({
    start(c) {
      c.error('e');
    },
  });

  try {
    for await (const chunk of s) {}
    assert_unreached();
  } catch (e) {
    assert_equals(e, 'e');
  }
}, 'Async-iterating an errored stream throws');

promise_test(async () => {
  const s = new ReadableStream({
    start(c) {
      c.close();
    }
  });

  for await (const chunk of s) {
    assert_unreached();
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

    // use a separate function for the loop body so return does not stop the test
    const loop = async () => {
      for await (const c of s.getIterator({ preventCancel })) {
        if (type === 'throw') {
          throw new Error();
        } else if (type === 'break') {
          break;
        } else if (type === 'return') {
          return;
        }
      }
    };

    try {
      await loop();
    } catch (e) {}

    if (preventCancel) {
      assert_array_equals(s.events, ['pull'], `cancel() should not be called when type = '${type}' and preventCancel is true`);
    } else {
      assert_array_equals(s.events, ['pull', 'cancel', undefined], `cancel() should be called when type = '${type}' and preventCancel is false`);
    }
  };

  for (const t of ['throw', 'break', 'return']) {
    await test(t, true);
    await test(t, false);
  }
}, 'Cancellation behavior');

promise_test(async () => {
  const test = async (preventCancel) => {
    const s = recordingReadableStream({
      start(c) {
        c.enqueue(0);
      }
    });

    const it = s.getIterator({ preventCancel });
    await it.return();

    if (preventCancel) {
      assert_array_equals(s.events, [], `cancel() should not be called when preventCancel is true`);
    } else {
      assert_array_equals(s.events, ['cancel', undefined], `cancel() should be called when preventCancel is false`);
    }
  };

  await test(true);
  await test(false);
}, 'Cancellation behavior when manually calling return()');

promise_test(async () => {
  const s = new ReadableStream();
  const it = s[Symbol.asyncIterator]();
  await it.return();
  try {
    await it.return();
    assert_unreached();
  } catch (e) {}
}, 'Calling return() twice rejects');

promise_test(async () => {
  const s = new ReadableStream({
    start(c) {
      c.enqueue(0);
      c.close();
    },
  });
  const it = s[Symbol.asyncIterator]();
  const next = await it.next();
  assert_equals(Object.getPrototypeOf(next), Object.prototype);
  assert_array_equals(Object.getOwnPropertyNames(next).sort(), ['done', 'value']);
}, 'next()\'s fulfillment value has the right shape');

test(() => {
  const s = new ReadableStream({
    start(c) {
      c.enqueue(0);
      c.close();
    },
  });
  const it = s.getIterator();
  assert_throws(new TypeError(), () => s.getIterator(), 'getIterator() should throw');
}, 'getIterator() throws if there\'s already a lock');
