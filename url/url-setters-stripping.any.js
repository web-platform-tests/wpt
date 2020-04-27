function urlString({ scheme = "https",
                     username = "username",
                     password = "password",
                     host = "host",
                     port = "8000",
                     pathname = "path",
                     search = "query",
                     hash = "fragment" }) {
  return `${scheme}://${username}:${password}@${host}:${port}/${pathname}?${search}#${hash}`;
}

function urlRecord() {
  return new URL(urlString({}));
}

for(let i = 0; i < 0x20; i++) {
  const stripped = i === 0x09 || i === 0x0A || i === 0x0D;

  // It turns out that user agents are surprisingly similar for these ranges so generate fewer
  // tests. If this is changed also change the logic for host below.
  if (i !== 0 && i !== 0x1F && !stripped) {
    continue;
  }

  const cpString = String.fromCodePoint(i);
  const cpReference = "U+" + i.toString(16).toUpperCase().padStart(4, "0");

  test(() => {
    const expected = stripped ? "http" : "https";
    const url = urlRecord();
    url.protocol = String.fromCodePoint(i) + "http";
    assert_equals(url.protocol, expected + ":", "property");
    assert_equals(url.href, urlString({ scheme: expected }), "href");
  }, `Setting protocol with leading ${cpReference}`);

  for (const property of ["username", "password"]) {
    test(() => {
      const expected = stripped ? "test" : encodeURIComponent(cpString) + "test";
      const url = urlRecord();
      url[property] = String.fromCodePoint(i) + "test";
      assert_equals(url[property], expected, "property");
      assert_equals(url.href, urlString({ [property]: expected }), "href");
    }, `Setting ${property} with leading ${cpReference}`);
  }

  test(() => {
    const expected = i === 0x00 ? "host" : stripped ? "test" : cpString + "test";
    const url = urlRecord();
    url.host = String.fromCodePoint(i) + "test";
    assert_equals(url.host, expected + ":8000", "property");
    assert_equals(url.href, urlString({ host: expected }), "href");
  }, `Setting host with leading ${cpReference}`);

  test(() => {
    const expected = i === 0x00 ? "host" : stripped ? "test" : cpString + "test";
    const url = urlRecord();
    url.hostname = String.fromCodePoint(i) + "test";
    assert_equals(url.hostname, expected, "property");
    assert_equals(url.href, urlString({ host: expected }), "href");
  }, `Setting hostname with leading ${cpReference}`);

  test(() => {
    const expected = stripped ? "9000" : "8000";
    const url = urlRecord();
    url.port = String.fromCodePoint(i) + "9000";
    assert_equals(url.port, expected, "property");
    assert_equals(url.href, urlString({ port: expected }), "href");
  }, `Setting port with leading ${cpReference}`);

  for (const [property, separator] of [["pathname", "/"], ["search", "?"], ["hash", "#"]]) {
    test(() => {
      const expected = stripped ? "test" : encodeURIComponent(cpString) + "test";
      const url = urlRecord();
      url[property] = String.fromCodePoint(i) + "test";
      assert_equals(url[property], separator + expected, "property");
      assert_equals(url.href, urlString({ [property]: expected }), "href");
    }, `Setting ${property} with leading ${cpReference}`);
  }
}
