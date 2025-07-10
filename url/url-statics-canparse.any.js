// This intentionally does not use resources/urltestdata.json to preserve resources.
[
  {
    "url": undefined,
    "base": undefined,
    "expected": false
  },
  {
    "url": "aaa:b",
    "base": undefined,
    "expected": true
  },
  {
    "url": undefined,
    "base": "aaa:b",
    "expected": false
  },
  {
    "url": undefined,
    "base": "https://test:test/",
    "expected": false
  },
  {
    "url": "aaa:/b",
    "base": undefined,
    "expected": true
  },
  {
    "url": undefined,
    "base": "aaa:/b",
    "expected": true
  },
  {
    "url": "https://test:test",
    "base": undefined,
    "expected": false
  },
  {
    "url": "a",
    "base": "https://b/",
    "expected": true
  },
  {
    "url": "C:\\path\\file.node",
    "base": undefined,
    "expected": true
  },
  {
    "url": "D:\\foo\\bar.exe",
    "base": undefined,
    "expected": true
  },
  // Problematic characters that should still be parseable
  {
    "url": "C:\\folder#fragment\\file.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\folder%20encoded\\file.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\folder\\file?.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\folder{brace}\\file.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\folder`backtick`\\file.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\folder^caret\\file.txt",
    "base": undefined,
    "expected": true
  },
  // Unicode and emoji paths
  {
    "url": "C:\\résumé\\café.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\中文\\文档.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\📁Folder\\📄Document.txt",
    "base": undefined,
    "expected": true
  },
  // UNC paths
  {
    "url": "\\\\server\\share\\file.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "\\\\server.domain.com\\share\\folder\\file.txt",
    "base": undefined,
    "expected": true
  },
  // Mixed separators
  {
    "url": "C:\\path/mixed\\separators/file.txt",
    "base": undefined,
    "expected": true
  },
  // Query and fragments
  {
    "url": "C:\\path\\file.html?query=value",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\path\\file.html#section",
    "base": undefined,
    "expected": true
  },
  // Edge cases that should FAIL canParse
  {
    "url": "C:\\invalid\\path\\with\\\\double\\backslash",
    "base": undefined,
    "expected": false
  },
  {
    "url": ":\\invalid\\drive",
    "base": undefined,
    "expected": false
  },
  {
    "url": "CC:\\path\\file.txt",
    "base": undefined,
    "expected": false
  },
  {
    "url": "1:\\path\\file.txt",
    "base": undefined,
    "expected": false
  },
  {
    "url": "@:\\path\\file.txt",
    "base": undefined,
    "expected": false
  },
  {
    "url": "C:\\\\\\path\\file.txt",
    "base": undefined,
    "expected": false
  },
  {
    "url": "C:\\path\\\\file.txt",
    "base": undefined,
    "expected": false
  },
  {
    "url": "C:\\\\",
    "base": undefined,
    "expected": false
  },
  // Boundary cases that should work
  {
    "url": "Z:\\root\\file.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "a:\\lowercase\\file.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\",
    "base": undefined,
    "expected": true
  },
  // Spaces and tabs
  {
    "url": "C:\\My Documents\\file with spaces.txt",
    "base": undefined,
    "expected": true
  },
  {
    "url": "C:\\folder\\file\twith\ttabs.txt",
    "base": undefined,
    "expected": true
  }
].forEach(({ url, base, expected }) => {
  test(() => {
    assert_equals(URL.canParse(url, base), expected);
  }, `URL.canParse(${url}, ${base})`);
});