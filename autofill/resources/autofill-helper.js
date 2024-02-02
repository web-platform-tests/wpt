function create_form_for_data(data) {
  const form = document.createElement('form');
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      const input = document.createElement('input');
      input.type = key;
      input.value = data[key];
      form.appendChild(input);
    }
  }
  return form;
};

function assert_element_has_value(element_id, value) {
  const element = document.getElementById(element_id);
  assert_equals(element.value, value);
};

async function wait_on_element_autofill(element_id) {
  const element = document.getElementById(element_id);
  return new Promise(async resolve => {
    if (element.getComputedStyle().getPropertyValue("color") == "red") {
      resolve();
    }
    await new Promise(r => step_timeout(r, 10));
  });
}
