// META: global=window,worker
// META: script=../resources/test-utils.js
// META: script=../resources/rs-utils.js
'use strict';

function createArrayBuffer()
{
  return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
}

function createVideoFrame()
{
  let init = {
    format: 'I420',
    timestamp: 1234,
    codedWidth: 4,
    codedHeight: 2
  };
  let data = new Uint8Array([
    1, 2, 3, 4, 5, 6, 7, 8,  // y
    1, 2,                    // u
    1, 2,                    // v
  ]);

  if (!self.VideoFrame) {
    self.VideoFrame = class {
      constructor(data, init) {
        this.format = init.format;
        this.isDetached = false;
      }
      close() {
        this.format = null;
        this.isDetached = true;
      }
    };
  }

  return new VideoFrame(data, init);
}

test(() => {
  new ReadableStream({ type: 'transfer' }); // ReadableStream constructed with 'transfer' type
}, 'ReadableStream can be constructed with transfer type');

test(() => {
  let startCalled = false;

  const source = {
    start(controller) {
      assert_equals(this, source, 'source is this during start');
      assert_true(controller instanceof ReadableStreamDefaultController, 'default controller');
      startCalled = true;
    },
    type: 'transfer'
  };

  new ReadableStream(source);
  assert_true(startCalled);
}, 'ReadableStream of type transfer should call start with a ReadableStreamDefaultController');

promise_test(async () => {
  const videoFrame = createVideoFrame();
  videoFrame.test = 1;
  const source = {
    start(controller) {
      assert_equals(videoFrame.format, 'I420');
      controller.enqueue(videoFrame, [videoFrame]);
      assert_equals(videoFrame.format, null);
      assert_equals(videoFrame.test, 1);
    },
    type: 'transfer'
  };

  const stream = new ReadableStream(source);
  // Cancelling the stream should close all video frames, thus no console messages of GCing VideoFrames should happen.
  stream.cancel();
}, 'ReadableStream of type transfer should close serialized chunks');

promise_test(async () => {
  const buffer = createArrayBuffer();
  buffer.test = 1;
  const source = {
    start(controller) {
      assert_equals(buffer.length, 8);
      controller.enqueue(buffer, [buffer]);
      assert_equals(buffer.length, 0);
      assert_equals(buffer.test, 1);
    },
    type: 'transfer'
  };

  const stream = new ReadableStream(source);
  const reader = stream.getReader();

  const chunk = await reader.read();
  assert_equals(chunk.value.length, 8);
  assert_equals(chunk.value.test, undefined);
}, 'ReadableStream of type transfer should transfer enqueued chunks');

promise_test(async () => {
  const videoFrame = createVideoFrame();
  videoFrame.test = 1;
  const source = {
    start(controller) {
      assert_equals(videoFrame.format, 'I420');
      controller.enqueue({ videoFrame }, [videoFrame]);
      assert_equals(videoFrame.format, null);
      assert_equals(videoFrame.test, 1);
    },
    type: 'transfer'
  };

  const stream = new ReadableStream(source);
  const reader = stream.getReader();

  const chunk = await reader.read();
  assert_equals(chunk.value.videoFrame.format, 'I420');
  assert_equals(chunk.value.videoFrame.test, undefined);

  chunk.value.videoFrame.close();
}, 'ReadableStream of type transfer should transfer JS chunks with transferred values');

promise_test(async () => {
  const videoFrame = createVideoFrame();
  videoFrame.close();
  const source = {
    start(controller) {
      try {
        controller.enqueue(videoFrame, [videoFrame]);
        assert_unreached('enqueue should throw');
      } catch (e) {
        //
      }
    },
    type: 'transfer'
  };

  const stream = new ReadableStream(source);
  const reader = stream.getReader();

  return reader.read().then(() => {
      assert_unreached('enqueue should error the stream');
  }, () => {
  });
}, 'ReadableStream of type transfer should error when trying to enqueue not serializable values');

promise_test(async () => {
  const videoFrame = createVideoFrame();
  const source = {
    start(controller) {
      controller.enqueue(videoFrame, [videoFrame]);
    },
    type: 'transfer'
  };

  const stream = new ReadableStream(source);
  const [clone1, clone2] = stream.tee();

  const chunk1 = await clone1.getReader().read();
  const chunk2 = await clone2.getReader().read();

  assert_equals(videoFrame.format, null);
  assert_equals(chunk1.value.format, 'I420');
  assert_equals(chunk2.value.format, 'I420');

  chunk1.value.close();
  chunk2.value.close();
}, 'ReadableStream of type transfer should clone serializable objects when teeing');

promise_test(async () => {
  const videoFrame = createVideoFrame();
  videoFrame.test = 1;
  const source = {
    start(controller) {
      assert_equals(videoFrame.format, 'I420');
      controller.enqueue({ videoFrame }, [videoFrame]);
      assert_equals(videoFrame.format, null);
      assert_equals(videoFrame.test, 1);
    },
    type: 'transfer'
  };

  const stream = new ReadableStream(source);
  const [clone1, clone2] = stream.tee();

  const chunk1 = await clone1.getReader().read();
  const chunk2 = await clone2.getReader().read();

  assert_equals(videoFrame.format, null);
  assert_equals(chunk1.value.videoFrame.format, 'I420');
  assert_equals(chunk2.value.videoFrame.format, 'I420');

  chunk1.value.videoFrame.close();
  chunk2.value.videoFrame.close();
}, 'ReadableStream of type transfer should clone JS Objects with serializables when teeing');

promise_test(async () => {
  const channel = new MessageChannel;
  let port1 = channel.port1;
  const port2 = channel.port2;

  const source = {
    start(controller) {
      controller.enqueue({port1}, [port1]);
    },
    type: 'transfer'
  };

  const stream = new ReadableStream(source);
  const [clone1, clone2] = stream.tee();

  await clone1.getReader().read().then((value) => {
    assert_unreached('clone2 should error');
  }, () => { });


  await clone2.getReader().read().then((value) => {
    assert_unreached('clone2 should error');
  }, () => { });
}, 'Second branch of transfer-only value ReadableStream tee should end up into errors');
