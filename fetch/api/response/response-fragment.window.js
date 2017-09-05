promise_test(() => {
  return fetch("./#test").then(res => {
    assert_equals(res.url, new URL("./", location).href);
    return fetch("../resources/redirect.py?location=/#test").then(res2 => {
      assert_equals(res2.url, new URL("/?location=%2F&count=1", location).href);
    });
  });
}, "Fragments don't end up in responses");
