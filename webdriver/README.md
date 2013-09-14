# W3C Browser Automation Specification Tests

This repository defines a set of conformance tests for the W3C web
browser automation specification known as WebDriver.  The purpose is
for the different driver implementations to be tested to determine
whether they meet the recognized standard.

## How to run the tests

1. It is highly recommended that you use a virtual Python environment.
   Install it via `<sudo> easy_install virtualenv`, `<sudo> pip
   install virtualenv`, or `<sudo> apt-get install python-virtualenv`
2. `virtualenv webdriver-tests`
3. `cd webdriver-tests`
4. `source bin/activate` to activate the local Python installation
5. `pip install selenium` or `easy_install selenium`
6. `cd _WEBDRIVER_TEST_ROOT_`
7. `python runtests.py`

To be run a specific test file you can just run `python test_file.py`

## Updating configuration

The _webdriver.cfg_ file holds any configuration that the tests might
require.  Change the value of browser to your needs.  This will then
be picked up by WebDriverBaseTest when tests are run.

## How to write tests

1. Create a test file per section from the specification.
2. For each test there needs to be one or more corresponding HTML
   files that will be used for testing.  HTML files are not to be
   reused between tests.
3. Test name should explain the intention of the test e.g. `def
   test_navigate_and_return_title(self):`
