promise_test(async t => {
  t.add_cleanup(async () => { await fetch("resources/bytes.py?delete") });
  let response = await fetch("resources/bytes.py?set");
  assert_equals(await response.text(), "set");
  response = await fetch("resources/bytes.py?get");
  const get = await response.text();
  const expected = "cookiesarebananas%3D%FFtest%FF"
  assert_equals(get.search(expected), 0, `Needs to contain ${expected} but did not. Full value: ${get}`);
}, "Cookie containing non-UTF-8 bytes");
promise_test(async t => {
  t.add_cleanup(async () => { await fetch("resources/bytes.py?delete") });
  let response = await fetch("resources/bytes.py?set_ctl");
  assert_equals(await response.text(), "set_ctl");
  response = await fetch("resources/bytes.py?get_ctl");
  const get = await response.text();
  const expected = "cookiesarebananas%3D"
  assert_equals(get.search(expected), 0, `Needs to contain ${expected} but did not. Full value: ${get}`);
}, "Cookie containing control characters");
