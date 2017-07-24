promise_test(() => {
  return fetch("resources/refresh.py").then(response => {
    assert_equals(response.headers.get("refresh"), "0;./refreshed.txt");
    assert_equals(response.url, (new URL("resources/refresh.py", self.location)).href);
  });
}, "Refresh does not affect subresources.");
