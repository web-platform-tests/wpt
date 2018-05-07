promise_test(() => {
  const form = document.body.appendChild(document.createElement("form")),
        input = form.appendChild(document.createElement("input"));
  input.type = "file";
  input.name = "hi";
  const fd = new FormData(form),
        entry = fd.get(input.name);
  assert_true(entry instanceof File, "entry is a File");
  assert_equals(entry.name, "", "name");
  assert_equals(entry.type, "application/octet-stream", "type");
  return new Response(entry).text().then(body => {
    assert_equals(body, "", "body");
  });
}, "Empty <input type=file> is still serialized");
