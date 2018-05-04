function compare_File(actual, input, test_obj) {
  assert_true(actual instanceof File, 'instanceof File');
  assert_equals(actual.name, input.name, 'name');
  assert_equals(actual.lastModified, input.lastModified, 'lastModified');
  compare_Blob(actual, input, test_obj, true);
}
function func_File_basic() {
  return new File(['foo'], 'bar', {type:'text/x-bar', lastModified:42});
}
check('File basic', func_File_basic, compare_File);

function compare_FileList(actual, input, test_obj) {
  if (typeof actual === 'string')
    assert_unreached(actual);
  assert_true(actual instanceof FileList, 'instanceof FileList');
  assert_equals(actual.length, input.length, 'length');
  assert_not_equals(actual, input);
  // XXX when there's a way to populate or construct a FileList,
  // check the items in the FileList
  if (test_obj)
    test_obj.done();
}
function func_FileList_empty() {
  var input = document.createElement('input');
  input.type = 'file';
  return input.files;
}
check('FileList empty', func_FileList_empty, compare_FileList);
check('Array FileList object, FileList empty', [func_FileList_empty], compare_Array(enumerate_props(compare_FileList)));
check('Object FileList object, FileList empty', {'x':func_FileList_empty}, compare_Object(enumerate_props(compare_FileList)));
