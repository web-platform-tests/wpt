form({
  filename: "basic-test.txt",
  expectedFilename: "basic-test.txt",
  description: "Basic test",
});

form({
  filename: "a\0b",
  expectedFilename: "a\0b",
  description: "Controls: 0x00",
});

form({
  filename: "a\nb",
  expectedFilename: "a\r\nb",
  description: "Newlines: \\n becomes \\r\\n",
});

form({
  filename: "a\rb",
  expectedFilename: "a\r\nb",
  description: "Newlines: \\r becomes \\r\\n",
});

form({
  filename: "a\n\rb",
  expectedFilename: "a\r\n\r\nb",
  description: "Newlines: \\n\\r becomes \\r\\n\\r\\n",
});

form({
  filename: "a\r\nb",
  expectedFilename: "a\r\nb",
  description: "Newlines: \\r\\n stays unchanged",
});

form({
  filename: 'a"b',
  expectedFilename: 'a"b',
  description: "Special punctuation: double quote",
});

form({
  filename: "a'b",
  expectedFilename: "a'b",
  description: "Special punctuation: single quote",
});

form({
  filename: "a\\b",
  expectedFilename: "a\\b",
  description: "Special punctuation: backslash",
});

form({
  filename: "ábc",
  expectedFilename: "\xC3\xA1bc",
  description: "Non-ASCII",
});

form({
  filename: "a\uFFFDb",
  expectedFilename: "a&#65533;b",
  formEncoding: "windows-1252",
  description: "Character not in encoding",
});

function form({
  filename,
  expectedFilename,
  formEncoding = "utf-8",
  description,
}) {
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
      action: "/FileAPI/file/resources/echo-content-escaped.py",
      method: "POST",
      enctype: "text/plain",
      target: formTargetFrame.name,
    });
    document.body.append(form);
    testCase.add_cleanup(() => {
      document.body.removeChild(form);
    });

    const fileInput = Object.assign(document.createElement("input"), {
      type: "file",
      name: "file",
    });
    form.append(fileInput);

    const textPlain = await new Promise((resolve) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([], filename, { type: "text/plain" }));
      fileInput.files = dataTransfer.files;

      form.submit();
      formTargetFrame.onload = () => {
        // Undo the newline normalization caused by loading the server's output
        // as an iframe, and decode the echo-content-escaped.py escapes to reach
        // an isomorphic-encoding of the bytes sent to the server.
        resolve(
          formTargetFrame.contentDocument.body.textContent
            .replace(/\n/g, "\r\n")
            .replace(
              /\\x[0-9a-f]{2}/gi,
              (esc) => String.fromCodePoint(parseInt(esc.substring(2), 16)),
            )
            .replace(/\\\\/g, "\\"),
        );
      };
    });

    const expected = `file=${expectedFilename}\r\n`;
    assert_equals(textPlain, expected);
  }, `Test urlencoding of filenames: ${description}`);
}
