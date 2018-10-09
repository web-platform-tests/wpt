test(() => {
  const frame = document.body.appendChild(document.createElement("iframe")),
        win = frame.contentWindow,
        loc = win.location;
  frame.remove();
  assert_equals(win.location, loc);
}, "Window and Location are 1:1 after browsing context removal");

function bcLessLocation() {
  const frame = document.body.appendChild(document.createElement("iframe")),
        win = frame.contentWindow,
        loc = win.location;
  frame.remove();
  return loc;
}

[
  ["href", "about:blank", "https://example.com/", "/", "http://test:test/", "test test", "test:test", "chrome:fail"],
  ["protocol", "about:", "http", "about", "test"],
  ["host", "", "example.com", "test test", "()"],
  ["hostname", "", "example.com"],
  ["port", "", "80", "", "443", "notaport"],
  ["pathname", "", "/", "x"],
  ["search", "", "test"],
  ["hash", "", "test", "#"]
].forEach(testSetup => {
  const prop = testSetup.shift(),
        expected = testSetup.shift();
  testSetup.forEach(value => {
  	test(() => {
  	  const loc = bcLessLocation();
  	  loc[prop] = value;
  	  assert_equals(loc[prop], expected);
  	}, "Setting `" + prop + "` to `" + value + "` of a `Location` object sans browsing context is a no-op");
  });
});

test(() => {
  const loc = bcLessLocation();
  assert_equals(loc.origin, "null");
}, "Getting `origin` of a `Location` object sans browsing context should be \"null\"");

["assign", "replace", "reload"].forEach(method => {
  ["about:blank", "https://example.com/", "/", "http://test:test/", "test test", "test:test", "chrome:fail"].forEach(value => {
    test(() => {
      const loc = bcLessLocation();
      loc[method](value);
      assert_equals(loc.href, "about:blank");
    }, "Invoking `" + method + "` with `" + value + "` on a `Location` object sans browsing context is a no-op");
  });
});

test(() => {
  const loc = bcLessLocation();
  assert_array_equals(loc.ancestorOrigins, []);
}, "Getting `ancestorOrigins` of a `Location` object sans browsing context should be []");
