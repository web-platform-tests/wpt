promise_test(async t => {
  t.add_cleanup(async () => { await fetch("resources/bytes.py?delete") });
  let response = await fetch("resources/bytes.py?set");
  assert_equals(await response.text(), "set");
  response = await fetch("resources/bytes.py?get");
  const get = await response.text();
  const expected = "cookiesarebananas%3D%FFtest_utf8%FF"
  assert_equals(get.search(expected), 0, `Needs to contain ${expected} but did not. Full value: ${get}`);
}, "Cookie containing non-UTF-8 bytes");
promise_test(async t => {
  t.add_cleanup(async () => { await fetch("resources/bytes.py?delete") });
  let response = await fetch("resources/bytes.py?set_CR");
  assert_equals(await response.text(), "set_CR");
  response = await fetch("resources/bytes.py?get");
  const get = await response.text();
  const expected = "cookiesarebananas%3D"
  assert_equals(get.search(expected), 0, `Needs to contain ${expected} but did not. Full value: ${get}`);
}, "Cookie containing CR should be truncated");
promise_test(async t => {
  t.add_cleanup(async () => { await fetch("resources/bytes.py?delete") });
  let response = await fetch("resources/bytes.py?set_LF");
  assert_equals(await response.text(), "set_LF");
  response = await fetch("resources/bytes.py?get");
  const get = await response.text();
  const expected = "cookiesarebananas%3D"
  assert_equals(get.search(expected), 0, `Needs to contain ${expected} but did not. Full value: ${get}`);
}, "Cookie containing LF should be truncated");
promise_test(async t => {
  t.add_cleanup(async () => { await fetch("resources/bytes.py?delete") });
  let response = await fetch("resources/bytes.py?set_NUL");
  assert_equals(await response.text(), "set_NUL");
  response = await fetch("resources/bytes.py?get");
  const get = await response.text();
  const expected = "cookiesarebananas%3D"
  assert_equals(get.search(expected), 0, `Needs to contain ${expected} but did not. Full value: ${get}`);
}, "Cookie containing NUL should be truncated");
promise_test(async t => {
  t.add_cleanup(async () => { await fetch("resources/bytes.py?delete") });
  let response = await fetch("resources/bytes.py?set_CTL");
  assert_equals(await response.text(), "set_CTL");
  response = await fetch("resources/bytes.py?get");
  const get = await response.text();
  const expected = "EMPTY";
  assert_equals(get.search(expected), 0, `Needs to contain ${expected} but did not. Full value: ${get}`);
}, "Cookie containing CTL char other than CR, LF, or NUL should be rejected");
