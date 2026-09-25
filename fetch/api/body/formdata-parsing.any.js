// The multipart/form-data parser, as reached through Response. These live apart
// from formdata.any.js for the same reason formdata-serializing.any.js does.
//
// Cases that depend on how the Content-Disposition value itself is parsed live
// in formdata-parsing-content-disposition.tentative.any.js, because that
// grammar is not settled.

// Everything below uses this boundary, spelled out in the payloads for
// readability.
const boundary = "boundary";

// multipart/form-data uses CRLF as its line terminator throughout.
function payload(...lines) {
  return lines.join("\r\n");
}

function parse(body, contentType = `multipart/form-data; boundary=${boundary}`) {
  return new Response(body, { headers: [["Content-Type", contentType]] }).formData();
}

// Each expected entry is [name, value], where value is either a string or an
// object describing the expected File.
async function assertEntries(formData, expected) {
  const actual = [...formData];
  assert_equals(actual.length, expected.length, "number of entries");
  for (let i = 0; i < expected.length; i++) {
    const [name, value] = actual[i];
    const [expectedName, expectedValue] = expected[i];
    assert_equals(name, expectedName, `entry ${i} name`);
    if (typeof expectedValue === "string") {
      assert_equals(value, expectedValue, `entry ${i} value`);
    } else {
      assert_true(value instanceof File, `entry ${i} value should be a File`);
      assert_equals(value.name, expectedValue.name, `entry ${i} filename`);
      assert_equals(value.type, expectedValue.type, `entry ${i} type`);
      assert_equals(await value.text(), expectedValue.body, `entry ${i} contents`);
    }
  }
}

const parsingCases = [
  {
    description: "file part without Content-Type",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"file\"; filename=\"hello.txt\"",
      "",
      "file contents",
      "--boundary--",
      ""
    ),
    expected: [["file", { name: "hello.txt", type: "text/plain", body: "file contents" }]]
  },
  {
    description: "file part with Content-Type",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"file\"; filename=\"image.png\"",
      "Content-Type: image/png",
      "",
      "PNG",
      "--boundary--",
      ""
    ),
    expected: [["file", { name: "image.png", type: "image/png", body: "PNG" }]]
  },
  {
    description: "file part with Content-Type before Content-Disposition",
    body: payload(
      "--boundary",
      "Content-Type: image/png",
      "Content-Disposition: form-data; name=\"file\"; filename=\"image.png\"",
      "",
      "PNG",
      "--boundary--",
      ""
    ),
    expected: [["file", { name: "image.png", type: "image/png", body: "PNG" }]]
  },
  {
    description: "string and file parts",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"field1\"",
      "",
      "value1",
      "--boundary",
      "Content-Disposition: form-data; name=\"file\"; filename=\"doc.txt\"",
      "Content-Type: text/plain",
      "",
      "file data",
      "--boundary",
      "Content-Disposition: form-data; name=\"field2\"",
      "",
      "value2",
      "--boundary--",
      ""
    ),
    expected: [
      ["field1", "value1"],
      ["file", { name: "doc.txt", type: "text/plain", body: "file data" }],
      ["field2", "value2"]
    ]
  },
  {
    // Escaping is one-way: the %0A, %0D and %22 sequences the serializer
    // produces are not decoded again, and no other percent sequence is
    // touched either.
    description: "percent sequences in a name are not decoded",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a%0Ab%0Dc%22d%0D%0Ae%25f%2Fg\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a%0Ab%0Dc%22d%0D%0Ae%25f%2Fg", "value"]]
  },
  {
    description: "percent sequences in a filename are not decoded",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"x%0Ay%0Dz%22w%25v.txt\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "x%0Ay%0Dz%22w%25v.txt", type: "text/plain", body: "value" }]]
  },
  {
    description: "empty filename",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "", type: "text/plain", body: "value" }]]
  },
  {
    description: "empty string part",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "",
      "--boundary--",
      ""
    ),
    expected: [["a", ""]]
  },
  {
    description: "empty file part",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"empty.txt\"",
      "",
      "",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "empty.txt", type: "text/plain", body: "" }]]
  },
  {
    description: "value containing the boundary as text",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "my boundary here",
      "--boundary--",
      ""
    ),
    expected: [["a", "my boundary here"]]
  },
  {
    description: "value containing --boundary not preceded by CRLF",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "x--boundary",
      "--boundary--",
      ""
    ),
    expected: [["a", "x--boundary"]]
  },
  {
    description: "value containing CRLF",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "line1",
      "line2",
      "--boundary--",
      ""
    ),
    expected: [["a", "line1\r\nline2"]]
  },
  {
    description: "transport padding after a delimiter",
    body: payload(
      "--boundary \t",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", "value"]]
  },
  {
    description: "transport padding after close delimiter",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "value",
      "--boundary-- \t",
      ""
    ),
    expected: [["a", "value"]]
  },
  {
    description: "transport padding after close delimiter at end of input",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "value",
      "--boundary--  "
    ),
    expected: [["a", "value"]]
  },
  {
    description: "epilogue after close delimiter",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "value",
      "--boundary--",
      "epilogue",
      "more epilogue"
    ),
    expected: [["a", "value"]]
  },
  {
    description: "duplicate names",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "1",
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "2",
      "--boundary--",
      ""
    ),
    expected: [
      ["a", "1"],
      ["a", "2"]
    ]
  },
  {
    description: "unknown headers are ignored",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "X-Custom: ignored",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", "value"]]
  },
  {
    // Content-Transfer-Encoding is deprecated by RFC 7578 and no transfer
    // decoding happens, so the part's contents are used as-is.
    description: "Content-Transfer-Encoding is ignored",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "Content-Transfer-Encoding: base64",
      "",
      "dmFsdWU=",
      "--boundary--",
      ""
    ),
    expected: [["a", "dmFsdWU="]]
  },
  {
    description: "header names are case-insensitive",
    body: payload(
      "--boundary",
      "CONTENT-DISPOSITION: form-data; name=\"a\"; filename=\"f\"",
      "CoNtEnT-TyPe: text/html",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "text/html", body: "value" }]]
  },
  {
    description: "whitespace before a header name",
    body: payload(
      "--boundary",
      " Content-Disposition: form-data; name=\"a\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", "value"]]
  },
  {
    description: "whitespace between a header name and the colon",
    body: payload(
      "--boundary",
      "Content-Disposition \t: form-data; name=\"a\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", "value"]]
  },
  {
    description: "duplicate Content-Type, last one wins",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: text/html",
      "Content-Type: text/plain",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "text/plain", body: "value" }]]
  },
  {
    description: "Content-Type value is trimmed",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: \t text/html \t",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "text/html", body: "value" }]]
  },
  {
    description: "Content-Type is ASCII lowercased",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: TEXT/HTML",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "text/html", body: "value" }]]
  },
  {
    // The Content-Type header is processed as elsewhere in Fetch (extract a
    // MIME type): the value has to be a valid MIME type, which is serialized
    // again, and the last valid one wins.
    description: "Content-Type that is not a MIME type is ignored",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: text",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "", body: "value" }]]
  },
  {
    description: "Content-Type is serialized as a MIME type",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: text/html;;x=\"y\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "text/html;x=y", body: "value" }]]
  },
  {
    description: "Content-Type with multiple values, last one wins",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: text/html, text/plain",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "text/plain", body: "value" }]]
  },
  {
    description: "non-ASCII Content-Type is ignored",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: text/é",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "", body: "value" }]]
  },
  {
    description: "Content-Type containing a control character is ignored",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: text/\u0001plain",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "", body: "value" }]]
  },
  {
    description: "empty Content-Type",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type:",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "f", type: "", body: "value" }]]
  },
  {
    description: "non-ASCII name",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"é\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["é", "value"]]
  },
  {
    description: "non-ASCII filename",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"中文.txt\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a", { name: "中文.txt", type: "text/plain", body: "value" }]]
  },
  {
    description: "non-ASCII value",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "😀",
      "--boundary--",
      ""
    ),
    expected: [["a", "😀"]]
  },
  {
    // Only CR and LF terminate a header line and only NUL makes a header
    // invalid, so other controls are part of the value.
    description: "other control characters in a name",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\u0001bc\"",
      "",
      "value",
      "--boundary--",
      ""
    ),
    expected: [["a\u0001bc", "value"]]
  },
  {
    description: "_charset_ is a normal entry",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"_charset_\"",
      "",
      "windows-1252",
      "--boundary--",
      ""
    ),
    expected: [["_charset_", "windows-1252"]]
  },
];

for (const { description, body, expected } of parsingCases) {
  promise_test(async t => {
    await assertEntries(await parse(body), expected);
  }, `Parse ${description}`);
}

const parsingFailureCases = [
  {
    description: "preamble before the first delimiter",
    body: payload(
      "preamble",
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "junk after close delimiter",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "value",
      "--boundary--junk",
      ""
    )
  },
  {
    description: "part without headers",
    body: payload(
      "--boundary",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "no Content-Disposition",
    body: payload(
      "--boundary",
      "Content-Type: text/plain",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "header without a colon",
    body: payload(
      "--boundary",
      "Content-Disposition form-data; name=\"a\"",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "header name that is not a token",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "Cont ent-Type: text/plain",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    // Header lines are not folded.
    description: "obs-fold continuation line",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data;",
      " name=\"a\"",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    // A header value cannot contain NUL.
    description: "NUL in a name",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\u0000b\"",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "NUL in an unknown header",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "X-Custom: a\u0000b",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "no close delimiter",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "value"
    )
  },
  {
    description: "no CRLF before close delimiter",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"",
      "",
      "value--boundary--",
      ""
    )
  },
  {
    // Each header line ends with CRLF, so a bare CR or LF is malformed.
    description: "bare LF in a name",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\nb\"",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "bare CR in a name",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\rb\"",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "bare LF in a filename",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\ng\"",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "bare LF in a header value",
    body: payload(
      "--boundary",
      "Content-Disposition: form-data; name=\"a\"; filename=\"f\"",
      "Content-Type: text/\nhtml",
      "",
      "value",
      "--boundary--",
      ""
    )
  },
  {
    description: "nothing after the first delimiter",
    body: payload(
      "--boundary"
    )
  },
];

for (const { description, body } of parsingFailureCases) {
  promise_test(async t => {
    await promise_rejects_js(t, TypeError, parse(body));
  }, `Parse failure: ${description}`);
}

promise_test(async t => {
  const body = payload(
    "--boundary",
    `Content-Disposition: form-data; name="a"`,
    "",
    "value",
    "--boundary--",
    ""
  );
  await promise_rejects_js(t, TypeError, parse(body, "multipart/form-data"));
}, "Parse failure: no boundary parameter");

promise_test(async t => {
  // A quoted empty boundary parameter survives MIME type parsing, but it
  // cannot delimit anything.
  const body = payload(
    "--",
    `Content-Disposition: form-data; name="a"`,
    "",
    "value",
    "----",
    ""
  );
  await promise_rejects_js(t, TypeError, parse(body, 'multipart/form-data; boundary=""'));
}, "Parse failure: empty boundary parameter");

promise_test(async t => {
  // A quoted boundary parameter can contain bytes that a token cannot.
  const body = payload(
    "--a.b(c)",
    `Content-Disposition: form-data; name="a"`,
    "",
    "value",
    "--a.b(c)--",
    ""
  );
  await assertEntries(await parse(body, 'multipart/form-data; boundary="a.b(c)"'),
                      [["a", "value"]]);
}, "Parse a quoted boundary parameter");

promise_test(async t => {
  // The Content-Type header contains the byte 0xE9, which is decoded to é as
  // part of MIME type parsing. The boundary is then looked for UTF-8 encoded,
  // as the string body is.
  const body = payload(
    "--bé",
    `Content-Disposition: form-data; name="a"`,
    "",
    "value",
    "--bé--",
    ""
  );
  await assertEntries(await parse(body, 'multipart/form-data; boundary="bé"'),
                      [["a", "value"]]);
}, "Parse a non-ASCII boundary parameter");

function utf8(string) {
  return new TextEncoder().encode(string);
}

promise_test(async t => {
  // A lone 0xFF byte in the name.
  const body = new Uint8Array([
    ...utf8(`--boundary\r\nContent-Disposition: form-data; name="a`),
    0xFF,
    ...utf8(`"\r\n\r\nvalue\r\n--boundary--\r\n`),
  ]);
  await assertEntries(await parse(body), [["a\uFFFD", "value"]]);
}, "Parse invalid UTF-8 in a name");

promise_test(async t => {
  // A lone 0xFF byte in the value.
  const body = new Uint8Array([
    ...utf8(`--boundary\r\nContent-Disposition: form-data; name="a"\r\n\r\nb`),
    0xFF,
    ...utf8("\r\n--boundary--\r\n"),
  ]);
  await assertEntries(await parse(body), [["a", "b\uFFFD"]]);
}, "Parse invalid UTF-8 in a value");

promise_test(async t => {
  // The contents of a file part are used as-is, including bytes that are not
  // valid UTF-8.
  const bytes = [0x00, 0x80, 0xFF, 0x0D, 0x0A, 0x2D, 0x2D];
  const body = new Uint8Array([
    ...utf8(`--boundary\r\nContent-Disposition: form-data; name="a"; filename="f"\r\n\r\n`),
    ...bytes,
    ...utf8("\r\n--boundary--\r\n"),
  ]);
  const file = (await parse(body)).get("a");
  assert_true(file instanceof File, "value should be a File");
  assert_array_equals(new Uint8Array(await file.arrayBuffer()), bytes);
}, "Parse a file part with arbitrary bytes");

promise_test(async t => {
  const body = payload(
    "--boundary",
    `Content-Disposition: form-data; name="a"; filename="f"`,
    "",
    "value",
    "--boundary--",
    ""
  );
  const file = (await parse(body)).get("a");
  assert_equals(file.lastModified, 0);
}, "Parse a file part's lastModified");
