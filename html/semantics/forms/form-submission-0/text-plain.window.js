form({
  name: "basic",
  value: "test",
  expected: "basic=test\r\n",
  description: "Basic test",
});

form({
  name: "basic",
  value: new File([], "file-test.txt"),
  expected: "basic=file-test.txt\r\n",
  description: "Basic File test",
});

form({
  name: "a\0b",
  value: "c",
  expected: "a\0b=c\r\n",
  description: "0x00 in name",
});

form({
  name: "a",
  value: "b\0c",
  expected: "a=b\0c\r\n",
  description: "0x00 in value",
});

form({
  name: "a",
  value: new File([], "b\0c"),
  expected: "a=b\0c\r\n",
  description: "0x00 in filename",
});

form({
  name: "a\nb",
  value: "c",
  expected: "a\r\nb=c\r\n",
  description: "\\n in name",
});

form({
  name: "a\rb",
  value: "c",
  expected: "a\r\nb=c\r\n",
  description: "\\r in name",
});

form({
  name: "a\r\nb",
  value: "c",
  expected: "a\r\nb=c\r\n",
  description: "\\r\\n in name",
});

form({
  name: "a\n\rb",
  value: "c",
  expected: "a\r\n\r\nb=c\r\n",
  description: "\\n\\r in name",
});

form({
  name: "a",
  value: "b\nc",
  expected: "a=b\r\nc\r\n",
  description: "\\n in value",
});

form({
  name: "a",
  value: "b\rc",
  expected: "a=b\r\nc\r\n",
  description: "\\r in value",
});

form({
  name: "a",
  value: "b\r\nc",
  expected: "a=b\r\nc\r\n",
  description: "\\r\\n in value",
});

form({
  name: "a",
  value: "b\n\rc",
  expected: "a=b\r\n\r\nc\r\n",
  description: "\\n\\r in value",
});

form({
  name: "a",
  value: new File([], "b\nc"),
  expected: "a=b\r\nc\r\n",
  description: "\\n in filename",
});

form({
  name: "a",
  value: new File([], "b\rc"),
  expected: "a=b\r\nc\r\n",
  description: "\\r in filename",
});

form({
  name: "a",
  value: new File([], "b\r\nc"),
  expected: "a=b\r\nc\r\n",
  description: "\\r\\n in filename",
});

form({
  name: "a",
  value: new File([], "b\n\rc"),
  expected: "a=b\r\n\r\nc\r\n",
  description: "\\n\\r in filename",
});

form({
  name: 'a"b',
  value: "c",
  expected: 'a"b=c\r\n',
  description: "double quote in name",
});

form({
  name: "a",
  value: 'b"c',
  expected: 'a=b"c\r\n',
  description: "double quote in value",
});

form({
  name: "a",
  value: new File([], 'b"c'),
  expected: 'a=b"c\r\n',
  description: "double quote in filename",
});

form({
  name: "a'b",
  value: "c",
  expected: "a'b=c\r\n",
  description: "single quote in name",
});

form({
  name: "a",
  value: "b'c",
  expected: "a=b'c\r\n",
  description: "single quote in value",
});

form({
  name: "a",
  value: new File([], "b'c"),
  expected: "a=b'c\r\n",
  description: "single quote in filename",
});

form({
  name: "a\\b",
  value: "c",
  expected: "a\\b=c\r\n",
  description: "backslash in name",
});

form({
  name: "a",
  value: "b\\c",
  expected: "a=b\\c\r\n",
  description: "backslash in value",
});

form({
  name: "a",
  value: new File([], "b\\c"),
  expected: "a=b\\c\r\n",
  description: "backslash in filename",
});

form({
  name: "áb",
  value: "ç",
  expected: "\xC3\xA1b=\xC3\xA7\r\n",
  description: "non-ASCII in name and value",
});

form({
  name: "a",
  value: new File([], "ə.txt"),
  expected: "a=\xC9\x99.txt\r\n",
  description: "non-ASCII in filename",
});

form({
  name: "aəb",
  value: "c\uFFFDd",
  formEncoding: "windows-1252",
  expected: "a&#601;b=c&#65533;d\r\n",
  description: "characters not in encoding in name and value",
});

form({
  name: "á",
  value: new File([], "💩"),
  formEncoding: "windows-1252",
  expected: "\xE1=&#128169;\r\n",
  description: "character not in encoding in filename",
});

function form({
  name,
  value,
  expected,
  formEncoding = "utf-8",
  description,
}) {
  // Normal form
  promise_test(async (testCase) => {
    if (document.readyState !== "complete") {
      await new Promise((resolve) => addEventListener("load", resolve));
    }

    const formTargetFrame = Object.assign(document.createElement("iframe"), {
      name: "formtargetframe",
    });
    document.body.append(formTargetFrame);
    testCase.add_cleanup(() => {
      document.body.removeChild(formTargetFrame);
    });

    const form = Object.assign(document.createElement("form"), {
      acceptCharset: formEncoding,
      // Using echo-content-escaped.py rather than /fetch/api/resources/echo-content.py
      // because we're doing tests with \x00, which can cause the response to be
      // detected as a binary file and served as a download).
      action: "/FileAPI/file/resources/echo-content-escaped.py",
      method: "POST",
      enctype: "text/plain",
      target: formTargetFrame.name,
    });
    document.body.append(form);
    testCase.add_cleanup(() => {
      document.body.removeChild(form);
    });

    const input = document.createElement("input");
    input.name = name;
    if (value instanceof File) {
      input.type = "file";
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(value);
      input.files = dataTransfer.files;
    } else {
      input.type = "hidden";
      input.value = value;
    }
    form.append(input);

    await new Promise((resolve) => {
      form.submit();
      formTargetFrame.onload = resolve;
    });

    const serialized = formTargetFrame.contentDocument.body.textContent;
    assert_equals(unescape(serialized), expected);
  }, `text/plain: ${description} (normal form)`);

  // formdata event
  promise_test(async (testCase) => {
    if (document.readyState !== "complete") {
      await new Promise((resolve) => addEventListener("load", resolve));
    }

    const formTargetFrame = Object.assign(document.createElement("iframe"), {
      name: "formtargetframe",
    });
    document.body.append(formTargetFrame);
    testCase.add_cleanup(() => {
      document.body.removeChild(formTargetFrame);
    });

    const form = Object.assign(document.createElement("form"), {
      acceptCharset: formEncoding,
      // Using echo-content-escaped.py rather than /fetch/api/resources/echo-content.py
      // because we're doing tests with \x00, which can cause the response to be
      // detected as a binary file and served as a download).
      action: "/FileAPI/file/resources/echo-content-escaped.py",
      method: "POST",
      enctype: "text/plain",
      target: formTargetFrame.name,
    });
    document.body.append(form);
    testCase.add_cleanup(() => {
      document.body.removeChild(form);
    });

    form.addEventListener("formdata", (evt) => {
      evt.formData.append(name, value);
    });

    await new Promise((resolve) => {
      form.submit();
      formTargetFrame.onload = resolve;
    });

    const serialized = formTargetFrame.contentDocument.body.textContent;
    assert_equals(unescape(serialized), expected);
  }, `text/plain: ${description} (formdata event)`);
}

function unescape(str) {
  return str.replace(/\r\n?|\n/g, "\r\n").replace(
    /\\x[0-9A-Fa-f]{2}/g,
    (escape) => String.fromCodePoint(parseInt(escape.substring(2), 16)),
  ).replace(/\\\\/g, "\\");
}
