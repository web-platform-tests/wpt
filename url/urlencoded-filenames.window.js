form({
  filename: "basic-test.txt",
  expectedFilename: "basic-test.txt",
  description: "Basic test",
});

form({
  filename: "a\0b",
  expectedFilename: "a%00b",
  description: "Controls: 0x00",
});

form({
  filename: "a\nb",
  expectedFilename: "a%0D%0Ab",
  description: "Newlines: \\n becomes \\r\\n",
});

form({
  filename: "a\rb",
  expectedFilename: "a%0D%0Ab",
  description: "Newlines: \\r becomes \\r\\n",
});

form({
  filename: "a\n\rb",
  expectedFilename: "a%0D%0A%0D%0Ab",
  description: "Newlines: \\n\\r becomes \\r\\n\\r\\n",
});

form({
  filename: "a\r\nb",
  expectedFilename: "a%0D%0Ab",
  description: "Newlines: \\r\\n stays unchanged",
});

form({
  filename: 'a"b',
  expectedFilename: "a%22b",
  description: "Special punctuation: double quote",
});

form({
  filename: "a'b",
  expectedFilename: "a%27b",
  description: "Special punctuation: single quote",
});

form({
  filename: "a\\b",
  expectedFilename: "a%5Cb",
  description: "Special punctuation: backslash",
});

form({
  filename: "ábc",
  expectedFilename: "%C3%A1bc",
  description: "Non-ASCII",
});

form({
  filename: "a\uFFFDb",
  expectedFilename: "a%26%2365533%3Bb",
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

    const fileInput = Object.assign(document.createElement("input"), {
      type: "file",
      name: "file",
    });
    form.append(fileInput);

    await new Promise((resolve) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([], filename, { type: "text/plain" }));
      fileInput.files = dataTransfer.files;

      form.submit();
      formTargetFrame.onload = resolve;
    });

    const urlencoded = formTargetFrame.contentDocument.body.textContent;
    const expected = `file=${expectedFilename}`;
    assert_equals(urlencoded, expected);
  }, `Test urlencoding of filenames: ${description}`);
}
