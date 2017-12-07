const blob = new Blob(['test']);
const file = new File(['test'], 'name');

test(() => {
  const url_count = 10000;
  let list = [];

  for (let i = 0; i <= url_count; ++i)
    list.push(URL.createObjectURL(blob));

  list.sort();

  for (let i = 0; i < url_count; ++i)
    assert_not_equals(list[i], list[i+1], 'generated Blob URLs should be unique');
}, 'Check whether generated Blob URLs are unique');

test(() => {
  const url = URL.createObjectURL(blob);
  assert_equals(typeof url, 'string');
  assert_true(url.startsWith('blob:'));
}, 'Check if the Blob URL starts with "blob:"');

test(() => {
  const url = URL.createObjectURL(file);
  assert_equals(typeof url, 'string');
  assert_true(url.startsWith('blob:'));
}, 'Check if the Blob URL starts with "blob:" for Files');

test(() => {
  const url = URL.createObjectURL(blob);
  assert_equals(new URL(url).origin, location.origin);
  if (location.origin != 'null') {
    assert_true(url.includes(location.origin));
    assert_true(url.startsWith('blob:' + location.protocol));
  }
}, 'Verify if origin of Blob URL matches our origin');

test(() => {
  const url = URL.createObjectURL(file);
  assert_equals(new URL(url).origin, location.origin);
  if (location.origin != 'null') {
    assert_true(url.includes(location.origin));
    assert_true(url.startsWith('blob:' + location.protocol));
  }
}, 'Verify if origin of Blob URL matches our origin for Files');
