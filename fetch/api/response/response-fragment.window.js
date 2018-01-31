promise_test(() => {
  return fetch("./#test").then(res => {
    assert_equals(res.url, new URL("./", location).href);
    return fetch("../resources/redirect.py?location=/#test").then(res2 => {
      // redirect.py changes the URL a bit; the important bit here is that the fragment is dropped
      assert_equals(res2.url, new URL("/?location=%2F&count=1", location).href);
      // redirect.py ends up appending some stuff to the fragment, but that does not affect this
      return fetch("../resources/redirect.py?location=/%23test").then(res3 => {
        assert_equals(res3.url, new URL("/", location).href);
      });
    });
  });
}, "Fragments don't end up in responses");
