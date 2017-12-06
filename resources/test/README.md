# `testharness.js` test suite

The test suite for the `testharness.js` testing framework.

## Executing Tests

Install the following dependencies:

- [Python 2.7](https://www.python.org/)
- [the tox Python package](https://tox.readthedocs.io/en/latest/)
- [the Mozilla Firefox web browser](https://mozilla.org/firefox)
- [the GeckoDriver server](https://github.com/mozilla/geckodriver)

Once these dependencies are satisfied, the tests may be run from a command line
by executing the following command from this directory:

    tox

Currently, the tests should be run with Firefox Nightly.

In order to specify the path to Firefox Nightly, use the following command-line option:

    tox -- --binary=/path/to/FirefoxNightly

## Authoring Tests

Test cases are expressed as `.html` files located within the `tests/`
sub-directory. Each test should include the `testharness.js` library with the
following markup:

    <script src="../../testharness.js"></script>
    <script src="../../testharnessreport.js"></script>

The file must also specify a `<meta>` tag whose `name` attribute is
`wpt-test-type` and whose `value` attribute is either `unit` or `functional`.
For example:

    <meta name="wpt-test-type" value="functional">

Subsequent sections of this file document the distinction between these two
test types.

This should be followed by one or more `<script>` tags that interface with the
`testharness.js` API in some way. For example:

    <script>
    test(function() {
        1 = 1;
      }, 'This test is expected to fail.');
    </script>

### Unit tests

The "unit test" type allows for concisely testing the expected behavior of
assertion methods. These tests may define any number of sub-tests; the
acceptance criteria is simply that any tests executed pass.

### Functional tests

In order to test the behavior of the harness itself, some tests must force
Thoroughly testing the behavior of the harness itself requires ensuring a
number of considerations which cannot be verified with the "unit testing"
strategy. These include:

- Ensuring that some tests are not run
- Ensuring conditions to cause test failures
- Ensuring conditions that cause harness errors

Functional tests allow for these details to be verified. Every functional test
must include a summary of the expected results as a JSON string within a
`<script>` tag with an `id` of `"expected"`, e.g.:

    <script type="text/json" id="expected">
    {
      "summarized_status": {
        "message": null,
        "stack": null,
        "status_string": "OK"
      },
      "summarized_tests": [
        {
          "message": "ReferenceError: invalid assignment left-hand side",
          "name": "Sample HTML5 API Tests",
          "properties": {},
          "stack": "(implementation-defined)",
          "status_string": "FAIL"
        }
      ],
      "type": "complete"
    }
    </script>
