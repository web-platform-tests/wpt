
async function runTest(autofillData, autofillElement) {
  // Test regular autofill of a full delivery address form starting at the top:
  await promise_test(async t => {
    if (!window.test_driver) {
      return;
    }

    const form = create_form_for_data();
    await test_driver.save_to_auto_fill(form);

    await test_driver.get_autofill_suggestions(document.getElementById("test_form"), document.getElementById("name"));

    // Run assertions against initial autofill data object:
    for(let fieldName in autofillData) {
      if (autofillData.hasOwnProperty(fieldName)) {
        assert_element_has_value(fieldName, autofillData[fieldName]);
      }
    }
  });
}
