// META: script=resources/test-helpers.js

'use strict';

directory_test(async (t, root) => {
  const handle = await createFileWithContents(t, 'file-before', 'foo', root);
  await handle.move(root, 'file-after');

  assert_array_equals(await getSortedDirectoryEntries(root), ['file-after']);
  assert_equals(await getFileContents(handle), 'foo');
  assert_equals(await getFileSize(handle), 3);
}, 'move(dir, name) to rename a file');

directory_test(async (t, root) => {
  const handle = await createFileWithContents(t, 'file-before', 'foo', root);
  await handle.move(root, 'file-before');

  assert_array_equals(await getSortedDirectoryEntries(root), ['file-before']);
  assert_equals(await getFileContents(handle), 'foo');
  assert_equals(await getFileSize(handle), 3);
}, 'move(dir, name) to rename a file the same name');

directory_test(async (t, root) => {
  const dir_src = await root.getDirectoryHandle('dir-src', {create: true});
  const dir_dest = await root.getDirectoryHandle('dir-dest', {create: true});
  const file = await createFileWithContents(t, 'file', 'abc', dir_src);
  await file.move(dir_dest);

  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir-dest/', 'dir-src/']);
  assert_array_equals(await getSortedDirectoryEntries(dir_src), []);
  assert_array_equals(await getSortedDirectoryEntries(dir_dest), ['file']);
  assert_equals(await getFileContents(file), 'abc');
  assert_equals(await getFileSize(file), 3);
}, 'move(dir) to move a file to a new directory');

directory_test(async (t, root) => {
  const dir_src = await root.getDirectoryHandle('dir-src', {create: true});
  const dir_dest = await root.getDirectoryHandle('dir-dest', {create: true});
  const file = await createFileWithContents(t, 'file', 'abc', dir_src);
  await file.move(dir_dest, '');

  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir-dest/', 'dir-src/']);
  assert_array_equals(await getSortedDirectoryEntries(dir_src), []);
  assert_array_equals(await getSortedDirectoryEntries(dir_dest), ['file']);
  assert_equals(await getFileContents(file), 'abc');
  assert_equals(await getFileSize(file), 3);
}, 'move(dir, "") to move a file to a new directory');

directory_test(async (t, root) => {
  const dir_src = await root.getDirectoryHandle('dir-src', {create: true});
  const dir_dest = await root.getDirectoryHandle('dir-dest', {create: true});
  const file =
      await createFileWithContents(t, 'file-in-dir-src', 'abc', dir_src);
  await file.move(dir_dest, 'file-in-dir-dest');

  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir-dest/', 'dir-src/']);
  assert_array_equals(await getSortedDirectoryEntries(dir_src), []);
  assert_array_equals(
      await getSortedDirectoryEntries(dir_dest), ['file-in-dir-dest']);
  assert_equals(await getFileContents(file), 'abc');
  assert_equals(await getFileSize(file), 3);
}, 'move(dir, name) to move a file to a new directory');

directory_test(async (t, root) => {
  const dir1 = await root.getDirectoryHandle('dir1', {create: true});
  const dir2 = await root.getDirectoryHandle('dir2', {create: true});
  const handle = await createFileWithContents(t, 'file', 'foo', root);

  await handle.move(dir1);
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), ['file']);
  assert_array_equals(await getSortedDirectoryEntries(dir2), []);
  assert_equals(await getFileContents(handle), 'foo');

  await handle.move(dir2);
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), []);
  assert_array_equals(await getSortedDirectoryEntries(dir2), ['file']);
  assert_equals(await getFileContents(handle), 'foo');

  await handle.move(root);
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/', 'file']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), []);
  assert_array_equals(await getSortedDirectoryEntries(dir2), []);
  assert_equals(await getFileContents(handle), 'foo');
}, 'move(dir) can be called multiple times');

directory_test(async (t, root) => {
  const dir1 = await root.getDirectoryHandle('dir1', {create: true});
  const dir2 = await root.getDirectoryHandle('dir2', {create: true});
  const handle = await createFileWithContents(t, 'file', 'foo', root);

  await handle.move(dir1, "");
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), ['file']);
  assert_array_equals(await getSortedDirectoryEntries(dir2), []);
  assert_equals(await getFileContents(handle), 'foo');

  await handle.move(dir2, "");
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), []);
  assert_array_equals(await getSortedDirectoryEntries(dir2), ['file']);
  assert_equals(await getFileContents(handle), 'foo');

  await handle.move(root, "");
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/', 'file']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), []);
  assert_array_equals(await getSortedDirectoryEntries(dir2), []);
  assert_equals(await getFileContents(handle), 'foo');
}, 'move(dir, "") can be called multiple times');

directory_test(async (t, root) => {
  const dir1 = await root.getDirectoryHandle('dir1', {create: true});
  const dir2 = await root.getDirectoryHandle('dir2', {create: true});
  const handle = await createFileWithContents(t, 'file', 'foo', root);

  await handle.move(dir1, 'file-1');
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), ['file-1']);
  assert_array_equals(await getSortedDirectoryEntries(dir2), []);
  assert_equals(await getFileContents(handle), 'foo');

  await handle.move(dir2, 'file-2');
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), []);
  assert_array_equals(await getSortedDirectoryEntries(dir2), ['file-2']);
  assert_equals(await getFileContents(handle), 'foo');

  await handle.move(root, 'file-3');
  assert_array_equals(
      await getSortedDirectoryEntries(root), ['dir1/', 'dir2/', 'file-3']);
  assert_array_equals(await getSortedDirectoryEntries(dir1), []);
  assert_array_equals(await getSortedDirectoryEntries(dir2), []);
  assert_equals(await getFileContents(handle), 'foo');
}, 'move(dir, name) can be called multiple times');

directory_test(async (t, root) => {
  const handle = await createFileWithContents(t, 'file-before', 'foo', root);
  await promise_rejects_js(
      t, TypeError, handle.move(root, '#$23423@352^*3243'));

  assert_array_equals(await getSortedDirectoryEntries(root), ['file-before']);
  assert_equals(await getFileContents(handle), 'foo');
  assert_equals(await getFileSize(handle), 3);
}, 'move(dir, name) with a name with invalid characters should fail');
