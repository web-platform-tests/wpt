form({
  name: "basic",
  value: "test",
  expected: "basic=test",
  description: "Basic test",
});

form({
  name: "basic",
  value: new File([], "file-test.txt"),
  expected: "basic=file-test.txt",
  description: "Basic File test",
});

form({
  name: "a\0b",
  value: "c",
  expected: "a%00b=c",
  description: "0x00 in name",
});

form({
  name: "a",
  value: "b\0c",
  expected: "a=b%00c",
  description: "0x00 in value",
});

form({
  name: "a",
  value: new File([], "b\0c"),
  expected: "a=b%00c",
  description: "0x00 in filename",
});

form({
  name: "a\nb",
  value: "c",
  expected: "a%0D%0Ab=c",
  description: "\\n in name",
});

form({
  name: "a\rb",
  value: "c",
  expected: "a%0D%0Ab=c",
  description: "\\r in name",
});

form({
  name: "a\r\nb",
  value: "c",
  expected: "a%0D%0Ab=c",
  description: "\\r\\n in name",
});

form({
  name: "a\n\rb",
  value: "c",
  expected: "a%0D%0A%0D%0Ab=c",
  description: "\\n\\r in name",
});

form({
  name: "a",
  value: "b\nc",
  expected: "a=b%0D%0Ac",
  description: "\\n in value",
});

form({
  name: "a",
  value: "b\rc",
  expected: "a=b%0D%0Ac",
  description: "\\r in value",
});

form({
  name: "a",
  value: "b\r\nc",
  expected: "a=b%0D%0Ac",
  description: "\\r\\n in value",
});

form({
  name: "a",
  value: "b\n\rc",
  expected: "a=b%0D%0A%0D%0Ac",
  description: "\\n\\r in value",
});

form({
  name: "a",
  value: new File([], "b\nc"),
  expected: "a=b%0D%0Ac",
  description: "\\n in filename",
});

form({
  name: "a",
  value: new File([], "b\rc"),
  expected: "a=b%0D%0Ac",
  description: "\\r in filename",
});

form({
  name: "a",
  value: new File([], "b\r\nc"),
  expected: "a=b%0D%0Ac",
  description: "\\r\\n in filename",
});

form({
  name: "a",
  value: new File([], "b\n\rc"),
  expected: "a=b%0D%0A%0D%0Ac",
  description: "\\n\\r in filename",
});

form({
  name: 'a"b',
  value: "c",
  expected: "a%22b=c",
  description: "double quote in name",
});

form({
  name: "a",
  value: 'b"c',
  expected: "a=b%22c",
  description: "double quote in value",
});

form({
  name: "a",
  value: new File([], 'b"c'),
  expected: "a=b%22c",
  description: "double quote in filename",
});

form({
  name: "a'b",
  value: "c",
  expected: "a%27b=c",
  description: "single quote in name",
});

form({
  name: "a",
  value: "b'c",
  expected: "a=b%27c",
  description: "single quote in value",
});

form({
  name: "a",
  value: new File([], "b'c"),
  expected: "a=b%27c",
  description: "single quote in filename",
});

form({
  name: "a\\b",
  value: "c",
  expected: "a%5Cb=c",
  description: "backslash in name",
});

form({
  name: "a",
  value: "b\\c",
  expected: "a=b%5Cc",
  description: "backslash in value",
});

form({
  name: "a",
  value: new File([], "b\\c"),
  expected: "a=b%5Cc",
  description: "backslash in filename",
});

form({
  name: "áb",
  value: "ç",
  expected: "%C3%A1b=%C3%A7",
  description: "non-ASCII in name and value",
});

form({
  name: "a",
  value: new File([], "ə.txt"),
  expected: "a=%C9%99.txt",
  description: "non-ASCII in filename",
});

form({
  name: "aəb",
  value: "c\uFFFDd",
  formEncoding: "windows-1252",
  expected: "a%26%23601%3Bb=c%26%2365533%3Bd",
  description: "characters not in encoding in name and value",
});

form({
  name: "á",
  value: new File([], "💩"),
  formEncoding: "windows-1252",
  expected: "%E1=%26%23128169%3B",
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
      // to work around WebKit not percent-encoding \x00 (which causes the
      // response to be detected as a binary file and served as a download).
      // The output should not change if the urlencoded serializer is correct.
      action: "/FileAPI/file/resources/echo-content-escaped.py",
      method: "POST",
      enctype: "application/x-www-form-urlencoded",
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

    const urlencoded = formTargetFrame.contentDocument.body.textContent;
    assert_equals(unescape(urlencoded), expected);
  }, `application/x-www-form-urlencoded: ${description} (normal form)`);

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
      // to work around WebKit not percent-encoding \x00 (which causes the
      // response to be detected as a binary file and served as a download).
      // The output should not change if the urlencoded serializer is correct.
      action: "/FileAPI/file/resources/echo-content-escaped.py",
      method: "POST",
      enctype: "application/x-www-form-urlencoded",
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

    const urlencoded = formTargetFrame.contentDocument.body.textContent;
    assert_equals(unescape(urlencoded), expected);
  }, `application/x-www-form-urlencoded: ${description} (formdata event)`);
}

function unescape(str) {
  return str.replace(/\r\n?|\n/g, "\r\n").replace(
    /\\x[0-9A-Fa-f]{2}/g,
    (escape) => String.fromCodePoint(parseInt(escape.substring(2), 16)),
  ).replace(/\\\\/g, "\\");
}
