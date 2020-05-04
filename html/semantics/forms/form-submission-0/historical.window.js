// META: script=./resources/targetted-form.js

test(t => {
  const form = populateForm('<input required><input type=submit>');
  t.add_cleanup(() => {
    form.previousElementSibling.remove();
    form.remove();
  });
  const submitter = form.querySelector('input[type=submit]');
  let invalid = form.querySelector('[required]');
  let counter = 0;
  form.addEventListener("invalid", t.step_func(() => counter++));
  form.oninvalid = t.step_func(() => counter++);
  invalid.addEventListener("invalid", t.step_func(() => counter++));
  invalid.oninvalid = t.step_func(() => counter++);
  submitter.click();
  assert_equals(counter, 2);
}, "invalid event is only supported for form controls");
