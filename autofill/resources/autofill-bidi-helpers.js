/**
 * Helper functions for autofill tests using WebDriver BiDi.
 *
 * These helpers use the WebDriver BiDi autofill.trigger command to test
 * browser autofill behavior.
 *
 * BiDi API: https://w3c.github.io/webdriver-bidi/#module-autofill
 */

/**
 * Trigger autofill on a form element using WebDriver BiDi.
 *
 * @param {Element} element - The form element to trigger autofill on
 * @param {Object} data - Autofill data mapping autocomplete field names to values
 * @returns {Promise} Resolves when autofill is complete
 *
 * @example
 * await triggerAutofill(document.getElementById('name'), {
 *   'name': 'John Doe',
 *   'address-line1': '123 Main St',
 *   'country': 'US'
 * });
 */
async function triggerAutofill(element, data) {
  if (!window.test_driver) {
    throw new Error('test_driver not available');
  }

  // Convert data object to fields array format expected by BiDi
  const fields = Object.entries(data).map(([name, value]) => ({
    name: name,
    value: value
  }));

  // Use the WebDriver BiDi autofill.trigger command via test_driver
  return await test_driver.bidi.autofill.trigger(element, fields);
}

/**
 * Assert that a form element has the expected value.
 *
 * @param {string} elementId - The ID of the element to check
 * @param {string} expectedValue - The expected value
 * @param {string} [message] - Optional assertion message
 */
function assertElementHasValue(elementId, expectedValue, message) {
  const element = document.getElementById(elementId);
  assert_not_equals(element, null, `Element with id '${elementId}' should exist`);
  const msg = message || `Element '${elementId}' should have value '${expectedValue}'`;
  assert_equals(element.value, expectedValue, msg);
}

/**
 * Standard address data for testing.
 */
const DEFAULT_ADDRESS_DATA = {
  'name': 'Max Mustermann',
  'address-line1': '1 Main St',
  'address-level2': 'Springfield',
  'postal-code': 'H0H 0H0',
  'address-level1': 'Ontario',
  'country': 'CA'
};

/**
 * Create a simple form with autofill fields for testing.
 *
 * @param {Object} fields - Object mapping field IDs to autocomplete values
 * @returns {HTMLFormElement} The created form element
 *
 * @example
 * const form = createAutofillForm({
 *   'name': 'name',
 *   'email': 'email'
 * });
 */
function createAutofillForm(fields) {
  const form = document.createElement('form');
  form.id = 'test_form';

  for (const [id, autocomplete] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    input.autocomplete = autocomplete;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  return form;
}

