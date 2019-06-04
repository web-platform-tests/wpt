// META: script=resources/test-helpers.js
promise_test(async t => cleanupSandboxedFileSystem(),
             'Cleanup to setup test environment');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'empty_blob');
  const stream = await handle.createWritable();

  await stream.write(0, new Blob([]));

  assert_equals(await getFileContents(handle), '');
  assert_equals(await getFileSize(handle), 0);
}, 'write() with an empty blob to an empty file');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'valid_blob');
  const stream = await handle.createWritable();

  await stream.write(0, new Blob(['1234567890']));

  assert_equals(await getFileContents(handle), '1234567890');
  assert_equals(await getFileSize(handle), 10);
}, 'write() a blob to an empty file');

promise_test(async t => {
    const handle = await createEmptyFile(t, 'blob_with_offset');
    const stream = await handle.createWritable();

    await stream.write(0, new Blob(['1234567890']));
    await stream.write(4, new Blob(['abc']));

    assert_equals(await getFileContents(handle), '1234abc890');
    assert_equals(await getFileSize(handle), 10);
}, 'write() called with a blob and a valid offset');

promise_test(async t => {
    const handle = await createEmptyFile(t, 'bad_offset');
    const stream = await handle.createWritable();

    await promise_rejects(t, 'InvalidStateError', stream.write(4, new Blob(['abc'])));

    assert_equals(await getFileContents(handle), '');
    assert_equals(await getFileSize(handle), 0);
}, 'write() called with an invalid offset');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'empty_string');
  const stream = await handle.createWritable();

  await stream.write(0, '');
  assert_equals(await getFileContents(handle), '');
  assert_equals(await getFileSize(handle), 0);
}, 'write() with an empty string to an empty file');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'valid_utf8_string');
  const stream = await handle.createWritable();

  await stream.write(0, 'foo🤘');
  assert_equals(await getFileContents(handle), 'foo🤘');
  assert_equals(await getFileSize(handle), 7);
}, 'write() with a valid utf-8 string');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'string_with_unix_line_ending');
  const stream = await handle.createWritable();

  await stream.write(0, 'foo\n');
  assert_equals(await getFileContents(handle), 'foo\n');
  assert_equals(await getFileSize(handle), 4);
}, 'write() with a string with unix line ending preserved');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'string_with_windows_line_ending');
  const stream = await handle.createWritable();

  await stream.write(0, 'foo\r\n');
  assert_equals(await getFileContents(handle), 'foo\r\n');
  assert_equals(await getFileSize(handle), 5);
}, 'write() with a string with windows line ending preserved');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'empty_array_buffer');
  const stream = await handle.createWritable();

  let buf = new ArrayBuffer(0);
  await stream.write(0, buf);
  assert_equals(await getFileContents(handle), '');
  assert_equals(await getFileSize(handle), 0);
}, 'write() with an empty array buffer to an empty file');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'valid_string_typed_byte_array');
  const stream = await handle.createWritable();

  let buf = new ArrayBuffer(3);
  let intView = new Uint8Array(buf);
  intView[0] = 0x66;
  intView[1] = 0x6f;
  intView[2] = 0x6f;
  await stream.write(0, buf);
  assert_equals(await getFileContents(handle), 'foo');
  assert_equals(await getFileSize(handle), 3);
}, 'write() with a valid typed array buffer');

promise_test(async t => {
    const handle = await createEmptyFile(t, 'trunc_shrink');
    const stream = await handle.createWritable();

    await stream.write(0, new Blob(['1234567890']));
    await stream.truncate(5);

    assert_equals(await getFileContents(handle), '12345');
    assert_equals(await getFileSize(handle), 5);
}, 'truncate() to shrink a file');

promise_test(async t => {
    const handle = await createEmptyFile(t, 'trunc_grow');
    const stream = await handle.createWritable();

    await stream.write(0, new Blob(['abc']));
    await stream.truncate(5);

    assert_equals(await getFileContents(handle), 'abc\0\0');
    assert_equals(await getFileSize(handle), 5);
}, 'truncate() to grow a file');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'stream_writer');
  const stream = await handle.createWritable();

  const writer = await stream.getWriter();
  await writer.ready;
  await writer.write("foo");

  // Wait until queue is clear to close.
  await writer.ready;
  await writer.close();

  assert_equals(await getFileContents(handle), 'foo');
  assert_equals(await getFileSize(handle), 3);
}, 'getWriter() to write string');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'stream_writer_write');
  const stream = await handle.createWritable();

  const writer = await stream.getWriter();
  await writer.ready;
  await writer.write(new Blob(['abc']));

  // Wait until queue is clear to close.
  await writer.ready;
  await writer.close();

  assert_equals(await getFileContents(handle), 'abc');
  assert_equals(await getFileSize(handle), 3);
}, 'getWriter() to write blob');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'stream_writer_multiple_writes');
  const stream = await handle.createWritable();

  const writer = await stream.getWriter();
  await writer.ready;
  await writer.write('foo');
  await writer.write('bar');

  // Wait until queue is clear to close.
  await writer.ready;
  await writer.close();

  assert_equals(await getFileContents(handle), 'foobar');
  assert_equals(await getFileSize(handle), 6);
}, 'getWriter().write() tracks file offset');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'stream_writer_separate_writers');
  const stream = await handle.createWritable();

  const writer1 = await stream.getWriter();
  await writer1.ready;
  await writer1.write('foo');

  await writer1.ready;
  writer1.releaseLock();
  assert_false(stream.locked, "stream is unlocked");

  const writer2 = await stream.getWriter();
  await writer2.ready;
  await writer2.write('bar');

  // Wait until queue is clear to close.
  await writer2.ready;
  await writer2.close();

  assert_equals(await getFileContents(handle), 'foobar');
  assert_equals(await getFileSize(handle), 6);
}, 'writing with multiple Writer instances from the same stream in succession appends');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'streams_maintain_position');
  const stream1 = await handle.createWritable();
  const stream2 = await handle.createWritable({position: 3});

  const writer1 = stream1.getWriter();
  const writer2 = stream2.getWriter();

  await writer1.ready;
  writer1.write('foo');
  await writer1.ready;
  await writer1.close();

  await writer2.ready;
  writer2.write('bar');
  await writer2.ready;
  await writer2.close();

  assert_equals(await getFileContents(handle), 'foobar');
  assert_equals(await getFileSize(handle), 6);
}, 'getWriter().write(): streams maintain positions');

promise_test(async t => {
  const handle = await createEmptyFile(t, 'streams_offset_error');
  const stream = await handle.createWritable({position: 5});
  const writer = stream.getWriter();
  await writer.ready;
  await promise_rejects(t, 'InvalidStateError', writer.write('foo'));
}, 'getWriter().write(): writing past end of file rejects');
