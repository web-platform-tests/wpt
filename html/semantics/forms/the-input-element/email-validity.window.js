[
  {
    "input": "a",
    "valid": false
  },
  {
    "input": "a@a",
    "valid": true
  },
  {
    "input": "a@ñ",
    "valid": true
  },
  {
    "input": "ñ@ñ",
    "valid": true
  },
  {
    "input": "a@123",
    "valid": true
  },
  {
    "input": "a@123.123.123.123",
    "valid": true
  },
  {
    "input": "a@123.123.123.123.123",
    "valid": false
  },
  {
    "input": "a@0xFFFFFFFFF",
    "valid": false
  },
  {
    "input": "a@[123.123.123.123]",
    "valid": false
  },
  {
    "input": "a@\uFFFD",
    "valid": false
  },
  {
    "input": "a@[::1]",
    "valid": true
  }
].forEach(({ input, valid }) => {
  test(() => {
    const control = document.createElement("input");
    control.type = "email";
    control.value = input;
    assert_equals(control.validity.valid, valid);
  }, `${input} is ${valid ? "valid" : "invalid"}`);

  /*
  // No browser normalizes script-given values currently. But I think they should...
  test(() => {
    const form = document.createElement("form");
    const control = form.appendChild(document.createElement("input"));
    control.type = "email";
    control.name = "email"
    control.value = input;
    const fd = new FormData(form);
    assert_equals(fd.get("email"), input);
  }, `${input} is normalized as ...`);
  */
});
