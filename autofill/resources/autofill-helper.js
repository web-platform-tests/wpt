async function save_address_fields(address_fields) {
  await test_driver.set_autofill_addresses(address_fields);
}

function assert_element_has_value(element_id, value) {
  const element = document.getElementById(element_id);
  assert_equals(element.value, value);
};

async function wait_on_element_autofill(element_id, autofill_style,
                                        autofill_style_value) {
  const element = document.getElementById(element_id);
  return new Promise(async (resolve, reject) => {
    let counter = 10;
    while (counter) {
      const style = getComputedStyle(element);
      if (style.getPropertyValue(autofill_style) == autofill_style_value) {
        resolve();
      }
      await new Promise(r => step_timeout(r, 10));
      --counter;
    }
    reject();
  });
}
