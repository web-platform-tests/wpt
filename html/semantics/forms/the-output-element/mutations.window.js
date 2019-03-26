function assert_equal_values(output, value) {
  assert_equals(output.value, value);
  assert_equals(output.defaultValue, value);
}
function assert_values(output, value, defaultValue) {
  assert_equals(output.value, value);
  assert_equals(output.defaultValue, defaultValue);
}

test(() => {
  const output = document.createElement("output"),
        child = output.appendChild(document.createElement("span"));
  assert_equal_values(output, "");
  child.textContent = "x";
  assert_equal_values(output, "x");
  output.value = "some";
  assert_values(output, "some", "x");
  child.textContent = "y";
  assert_values(output, "y", "x");
}, "Descendant mutations and output.value and .defaultValue");

test(() => {
  const form = document.createElement("form"),
        output = form.appendChild(document.createElement("output"));
  output.textContent = "value";
  assert_equal_values(output, "value");
  output.value = "heya";
  assert_values(output, "heya", "value");
  form.reset();
  assert_equal_values(output, "value");

  output.innerHTML = "<div>something</div>";
  assert_equal_values(output, "something");
  form.reset();
  assert_equal_values(output, "something");
}, "output and output.form.reset()");
